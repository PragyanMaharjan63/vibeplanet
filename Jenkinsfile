pipeline {
    agent any

    options {
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Inject Environment File') {
            steps {
                // The project has a single root .env (docker-compose reads it
                // directly, and the backend container gets it via env_file).
                // It's gitignored, so checkout scm never brings it in — pull
                // it from the "pragyan-main-env" Secret file credential.
                withCredentials([file(credentialsId: 'pragyan-main-env', variable: 'ENV_FILE')]) {
                    sh '''
                        rm -f .env
                        cp "$ENV_FILE" .env
                    '''
                }
            }
        }

        stage('Trivy Scan') {
            steps {
                // Scan project dependencies and configuration without scanning
                // the injected .env secret file.
                sh 'trivy fs --scanners vuln,misconfig --severity HIGH,CRITICAL --exit-code 0 .'
            }
        }

        stage('Build and Start Containers') {
            steps {
                // Build the images, recreate the Compose stack, and leave all
                // services running in the background on the Jenkins host.
                sh 'docker compose up --detach --build --remove-orphans'
            }
        }
    }
}
