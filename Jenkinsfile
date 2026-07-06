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
                // 1) Graceful teardown of THIS project's stack (keeps volumes:
                //    no -v flag, so web1_mongo-data is preserved — data is safe).
                sh 'docker compose down --remove-orphans || true'
                // 2) Force-remove any leftover fixed-name containers by NAME.
                //    An older run (different compose project) can leave a stale
                //    "web1-mongo" that `compose down` won't match by project label;
                //    removing by name clears it. Only removes containers, never volumes.
                sh 'docker rm -f web1-mongo web1-redis web1-backend web1-frontend web1-backup 2>/dev/null || true'
                // 3) Build images and start the stack, reattaching to web1_mongo-data.
                sh 'docker compose up --build -d'
            }
        }
    }
}
