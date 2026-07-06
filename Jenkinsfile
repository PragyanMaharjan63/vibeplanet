pipeline {
    agent any

    options {
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        CI = 'true'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build & Start Services') {
            steps {
                // Tear down any previous stack first so leftover fixed-name
                // containers (web1-mongo, etc.) don't cause a name conflict.
                // No -v flag, so named volumes (web1_mongo-data) are KEPT — data is safe.
                sh 'docker compose down --remove-orphans || true'
                sh 'docker compose up --build -d'
            }
        }
    }
}
