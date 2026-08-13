pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Backend Docker Image') {
            steps {
                sh 'docker build -t ecommerce-backend ./server'
            }
        }

        stage('Build Frontend Docker Image') {
            steps {
                sh 'docker build -t ecommerce-frontend ./client'
            }
        }

        stage('Verify Docker Images') {
            steps {
                sh 'docker images | grep ecommerce'
            }
        }
    }

    post {
        success {
            echo 'Docker images built successfully!'
        }
        failure {
            echo 'Jenkins build failed.'
        }
    }
}
