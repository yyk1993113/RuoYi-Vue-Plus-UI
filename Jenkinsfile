// ============================================================
// RuoYi-Vue-Plus-UI 管理后台前端 Jenkinsfile
// Vue3 + Vite + pnpm + Element Plus (RuoYi-Vue-Plus 5.x)
// 需要 Node >= 20.19.0
// ============================================================

pipeline {
    agent any

    environment {
        PROJECT_NAME = 'ruoyi-vue-plus-ui'
        DEPLOY_DIR = 'D:\\deploy\\ruoyi-vue-plus-ui'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 20, unit: 'MINUTES')
        timestamps()
    }

    triggers {
        pollSCM('H/5 * * * *')
    }

    stages {
        stage('检出代码') {
            steps {
                echo '拉取前端管理后台代码...'
                checkout scm
                bat 'git log -1 --oneline'
            }
        }

        stage('安装依赖') {
            steps {
                echo '安装pnpm依赖 (使用国内镜像)...'
                bat 'pnpm install --registry=https://registry.npmmirror.com'
            }
        }

        stage('构建') {
            steps {
                echo '构建前端项目 (build:prod)...'
                bat 'pnpm run build:prod'
                echo '前端构建完成！'
            }
        }

        stage('部署') {
            steps {
                echo '部署静态资源到Web目录...'
                bat '''
                @echo off
                if not exist "%DEPLOY_DIR%" mkdir "%DEPLOY_DIR%"
                if not exist "%DEPLOY_DIR%\\backup" mkdir "%DEPLOY_DIR%\\backup"
                if exist "%DEPLOY_DIR%\\index.html" (
                    set BACKUP_DIR=%DEPLOY_DIR%\\backup\\%BUILD_NUMBER%
                    mkdir "%BACKUP_DIR%"
                    xcopy /E /Y /I "%DEPLOY_DIR%" "%BACKUP_DIR%\\" 2>nul
                )
                REM 清理旧文件（保留backup）
                for /d %%i in ("%DEPLOY_DIR%\\*") do (
                    if /i not "%%~nxi"=="backup" rd /s /q "%%i"
                )
                del /q "%DEPLOY_DIR%\\*.*" 2>nul
                REM 复制构建产物（RuoYi-UI build输出到dist目录）
                xcopy /E /Y /I "dist" "%DEPLOY_DIR%"
                echo 部署完成!
                '''
            }
        }

        stage('Nginx重载') {
            steps {
                echo '提示：如需Nginx重载请取消下一行注释'
                bat 'echo 如需Nginx reload, 请配置: nginx -s reload'
                // bat 'nginx -s reload'
            }
        }
    }

    post {
        success {
            echo "RuoYi-Vue-Plus-UI 构建部署成功! Build #${env.BUILD_NUMBER}"
        }
        failure {
            echo "RuoYi-Vue-Plus-UI 构建失败! Build #${env.BUILD_NUMBER}"
        }
    }
}
