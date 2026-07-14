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

        stage('Build and Start Containers') {
            steps {
                // Build the images, recreate the Compose stack, and leave all
                // services running in the background on the Jenkins host.
                sh 'docker compose up --detach --build --remove-orphans'
            }
        }
    }
}
