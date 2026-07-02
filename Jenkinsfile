// ============================================================
// RuoYi-Vue-Plus-UI 前端 Jenkinsfile
// Vue3 + Vite + pnpm + Element Plus
// ============================================================

pipeline {
    agent any

    environment {
        PROJECT_NAME = 'ruoyi-vue-plus-ui'
        DEPLOY_DIR = 'D:\\deploy\\ruoyi-vue-plus-ui'
        PATH = "D:\\maven\\apache-maven-3.9.9\\bin;C:\\Program Files\\nodejs;C:\\Program Files\\Git\\cmd;${env.PATH}"
        CI = 'true'
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
                echo '安装pnpm依赖...'
                writeFile file: '.npmrc', text: 'approve-builds=*\r\nregistry=https://registry.npmmirror.com'
                bat 'pnpm install'
            }
        }

        stage('构建') {
            steps {
                echo '构建前端项目...'
                bat 'pnpm run build:prod'
                echo '构建完成'
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
                for /d %%i in ("%DEPLOY_DIR%\\*") do (
                    if /i not "%%~nxi"=="backup" rd /s /q "%%i"
                )
                del /q "%DEPLOY_DIR%\\*.*" 2>nul
                xcopy /E /Y /I "dist" "%DEPLOY_DIR%"
                echo 部署完成
                '''
            }
        }

        stage('Nginx重载') {
            steps {
                echo '提示: 如使用Nginx请配置reload命令'
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
