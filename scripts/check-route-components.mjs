import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uiRoot = path.resolve(__dirname, '..')
const viewsRoot = path.join(uiRoot, 'src/views')

const defaultSqlFiles = [
  '../RuoYi-Vue-Plus/script/sql/ry_vue_5.X.sql',
  '../RuoYi-Vue-Plus/script/sql/ry_recruitment.sql',
  '../RuoYi-Vue-Plus/script/sql/ry_recruitment_menu.sql',
  '../RuoYi-Vue-Plus/script/sql/ruoyi_recruitment_full.sql',
  '../RuoYi-Vue-Plus/script/sql/ry_job_category_menu.sql',
  '../RuoYi-Vue-Plus/script/sql/ry_rec_promoter_menu.sql',
  '../RuoYi-Vue-Plus/script/sql/ry_rec_promoter_workbench_menu.sql',
  '../RuoYi-Vue-Plus/script/sql/update/recruitment_admin_menu_structure_fix.sql',
  '../RuoYi-Vue-Plus/script/sql/update/system_menu_route_component_cleanup.sql'
].map((file) => path.resolve(uiRoot, file))

const sqlFiles = (process.argv.slice(2).length ? process.argv.slice(2).map((file) => path.resolve(file)) : defaultSqlFiles).filter((file) =>
  fs.existsSync(file)
)

const specialComponents = new Set(['', 'Layout', 'ParentView', 'InnerLink'])
const componentPathPattern = /^[A-Za-z0-9][A-Za-z0-9/_-]*$/

const stripLineComments = (sql) =>
  sql
    .split(/\r?\n/)
    .filter((line) => !line.trimStart().startsWith('--'))
    .join('\n')

const splitStatements = (sql) => {
  const statements = []
  let current = ''
  let inQuote = false

  for (let i = 0; i < sql.length; i += 1) {
    const char = sql[i]
    const next = sql[i + 1]

    if (char === "'" && next === "'") {
      current += char + next
      i += 1
      continue
    }
    if (char === "'") inQuote = !inQuote

    if (char === ';' && !inQuote) {
      if (current.trim()) statements.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  if (current.trim()) statements.push(current.trim())
  return statements
}

const splitTopLevelCsv = (input) => {
  const parts = []
  let current = ''
  let depth = 0
  let inQuote = false

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i]
    const next = input[i + 1]

    if (char === "'" && next === "'") {
      current += char + next
      i += 1
      continue
    }
    if (char === "'") inQuote = !inQuote
    if (!inQuote && char === '(') depth += 1
    if (!inQuote && char === ')') depth -= 1

    if (char === ',' && !inQuote && depth === 0) {
      parts.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  if (current.trim()) parts.push(current.trim())
  return parts
}

const readParenthesized = (input, startIndex) => {
  let inQuote = false
  let depth = 0
  let content = ''

  for (let i = startIndex; i < input.length; i += 1) {
    const char = input[i]
    const next = input[i + 1]

    if (char === "'" && next === "'") {
      content += char + next
      i += 1
      continue
    }
    if (char === "'") inQuote = !inQuote

    if (!inQuote && char === '(') {
      depth += 1
      if (depth === 1) continue
    }
    if (!inQuote && char === ')') {
      depth -= 1
      if (depth === 0) return content
    }
    if (depth >= 1) content += char
  }

  return ''
}

const parseSqlValue = (value) => {
  const trimmed = value.trim()
  if (/^null$/i.test(trimmed)) return ''
  const stringMatch = trimmed.match(/^N?'([\s\S]*)'$/i)
  if (stringMatch) return stringMatch[1].replace(/''/g, "'")
  return trimmed
}

const extractInsertComponents = (statement) => {
  if (!/^insert\s+into\s+sys_menu\b/i.test(statement)) return []

  const valuesIndex = statement.search(/\bvalues\b/i)
  if (valuesIndex === -1) return []

  const valuesStart = statement.indexOf('(', valuesIndex)
  const values = splitTopLevelCsv(readParenthesized(statement, valuesStart)).map(parseSqlValue)
  const columnMatch = statement.match(/^insert\s+into\s+sys_menu\s*\(([\s\S]*?)\)\s*values/i)
  if (columnMatch) {
    const columns = splitTopLevelCsv(columnMatch[1]).map((column) => column.replace(/[`"']/g, '').trim().toLowerCase())
    const componentIndex = columns.indexOf('component')
    if (componentIndex === -1) return []
    return [
      {
        menuId: values[columns.indexOf('menu_id')] || '',
        menuName: values[columns.indexOf('menu_name')] || '',
        component: values[componentIndex] || ''
      }
    ]
  }

  return [
    {
      menuId: values[0] || '',
      menuName: values[1] || '',
      component: values[5] || ''
    }
  ]
}

const extractUpdateComponents = (statement) => {
  if (!/^update\s+sys_menu\b/i.test(statement)) return []
  const setMatch = statement.match(/\bset\b([\s\S]*?)(?:\bwhere\b|$)/i)
  if (!setMatch) return []
  const matches = [...setMatch[1].matchAll(/\bcomponent\s*=\s*(NULL|N?'(?:[^']|'')*')/gi)]
  return matches.map((match) => ({ menuId: '', menuName: '', component: parseSqlValue(match[1]) }))
}

const collectComponents = (file) => {
  const sql = stripLineComments(fs.readFileSync(file, 'utf8'))
  return splitStatements(sql).flatMap((statement) => [
    ...extractInsertComponents(statement).map((item) => ({ ...item, file })),
    ...extractUpdateComponents(statement).map((item) => ({ ...item, file }))
  ])
}

const isSafeComponentPath = (component) =>
  componentPathPattern.test(component) && !component.includes('//') && !component.includes('..') && !component.endsWith('/')

const issues = sqlFiles.flatMap(collectComponents).flatMap((item) => {
  const component = item.component.trim()
  if (specialComponents.has(component)) return []
  if (!isSafeComponentPath(component)) {
    return [{ ...item, component, reason: 'invalid path format' }]
  }
  const vueFile = path.join(viewsRoot, `${component}.vue`)
  if (!fs.existsSync(vueFile)) {
    return [{ ...item, component, reason: `missing ${path.relative(uiRoot, vueFile)}` }]
  }
  return []
})

if (issues.length > 0) {
  console.error('Route component check failed:')
  for (const issue of issues) {
    console.error(
      `- ${path.relative(uiRoot, issue.file)} menuId=${issue.menuId || '-'} menuName=${issue.menuName || '-'} component=${issue.component}: ${issue.reason}`
    )
  }
  process.exit(1)
}

console.log(`Route component check passed (${sqlFiles.length} SQL files).`)
