// ============================================================
// RuoYi-Vue-Plus-UI Frontend Jenkinsfile
// Vue3 + Vite + pnpm + Element Plus
// ============================================================

pipeline {
    agent any

    environment {
        PROJECT_NAME = 'ruoyi-vue-plus-ui'
        DEPLOY_DIR = 'D:\\deploy\\ruoyi-vue-plus-ui'
        PATH = "D:\\maven\\apache-maven-3.9.9\\bin;C:\\Program Files\\nodejs;C:\\Program Files\\Git\\cmd;${env.PATH}"
        CI = 'false'
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
        stage('Checkout') {
            steps {
                echo 'Checking out frontend admin code...'
                checkout scm
                bat 'git log -1 --oneline'
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing pnpm dependencies...'
                writeFile file: '.npmrc', text: 'onlyBuiltDependencies=*\r\nregistry=https://registry.npmmirror.com'
                bat 'pnpm install --config.onlyBuiltDependencies=*'
            }
        }

        stage('Build') {
            steps {
                echo 'Building frontend project...'
                bat 'pnpm run build:prod'
                echo 'Build complete'
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deploying static assets...'
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
                echo Deploy complete
                '''
            }
        }
    }

    post {
        success {
            echo "RuoYi-Vue-Plus-UI build and deploy successful! Build #${env.BUILD_NUMBER}"
        }
        failure {
            echo "RuoYi-Vue-Plus-UI build failed! Build #${env.BUILD_NUMBER}"
        }
    }
}
