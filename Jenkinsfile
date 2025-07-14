pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = 'yonatanfurmandocker'
        BACKEND_IMAGE = "${DOCKER_REGISTRY}/jenkins-backend"
        FRONTEND_IMAGE = "${DOCKER_REGISTRY}/jenkins-frontend"
        BUILD_NUMBER = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Backend') {
            steps {
                script {
                    dir('backend') {
                        sh 'npm install'
                        sh 'npm test'

                        // Build Docker image
                        def backendImage = docker.build("${BACKEND_IMAGE}:${BUILD_NUMBER}")

                        // Add authentication wrapper
                        docker.withRegistry('https://index.docker.io/v1/', 'docker-hub-credentials') {
                            backendImage.push("${BUILD_NUMBER}")
                            backendImage.push('latest')
                        }
                        // Tag as latest
                        backendImage.tag('latest')
                    }
                }
            }
        }

        stage('Build Frontend') {
            steps {
                script {
                    dir('frontend') {
                        // Build Docker image
                        def frontendImage = docker.build("${FRONTEND_IMAGE}:${BUILD_NUMBER}")

                        // Same authentication as backend
                        docker.withRegistry('https://index.docker.io/v1/', 'docker-hub-credentials') {
                            frontendImage.push("${BUILD_NUMBER}")
                            frontendImage.push('latest')
                        }
                    }
                }
            }
        }

        stage('Integration Test') {
            steps {
                script {
                    // Start services with docker-compose
                    sh 'docker compose up -d'

                    // Wait for services to be ready
                    sh 'sleep 10'

                    // Run integration tests

                    sh '''
                        # Test backend health
                        curl -f http://localhost:3001/health || exit 1

                        # Test frontend availability
                        curl -f http://localhost:8081 || exit 1

                        # Test API endpoints
                        curl -f http://localhost:3001/api/users || exit 1
                        curl -f http://localhost:3001/api/todos || exit 1
                    '''
                }
            }
            post {
                always {
                    sh 'docker compose down'
                }
            }
        }

        stage('Deploy to Staging') {
            when {
                branch 'main'
            }
            steps {
                script {
                    // Deploy to staging environment
                    sh '''
                        echo "Deploying to staging..."
                        # Update image tags in deployment manifests
                        sed -i "s|image: todo-backend:.*|image: ${BACKEND_IMAGE}:${BUILD_NUMBER}|" k8s/staging/backend-deployment.yaml
                        sed -i "s|image: todo-frontend:.*|image: ${FRONTEND_IMAGE}:${BUILD_NUMBER}|" k8s/staging/frontend-deployment.yaml

                        # Commit updated manifests (for GitOps with ArgoCD)
                        git add k8s/staging/
                        git commit -m "Update staging images to build ${BUILD_NUMBER}" || true
                        git push origin main || true
                    '''
                }
            }
        }
    }

    post {
        always {
            // Clean up
            sh 'docker system prune -f'
        }
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}
