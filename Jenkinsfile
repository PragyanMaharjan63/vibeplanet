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

        stage('Build Images') {
            steps {
                // CI only: build the three images (frontend, backend, backup) to
                // verify their Dockerfiles compile. We do NOT `up` the stack here
                // because this server is not the deploy target — so there are no
                // containers, no env files needed, no database, and nothing left
                // running after the build.
                sh 'docker compose build'
            }
        }
    }
}
