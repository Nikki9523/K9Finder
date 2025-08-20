# K9-Finder

K9Finder is an application built with node.js and Express.js and AWS. It currently is backend only. K9Finder is a dog adoption application which allows for the management of users and dogs available for adoption from shelters. The project uses CI/CD principles with Github Actions pipelines, automation testing and performance testing.

## Features

- Login, Users and dog management APIs.
- Data hosted on AWS DynamoDB
- AWS Cognito for managing users and authentication
- High code coverage with unit testing
- Integration testing using dynamoDB local and supertest
- Performance testing using K6
- Github actions integration to run CI/CD pipelines

## Getting Started

### Prerequisites

- Node.js (v22+)
- npm
- python (for pre-commit hooks)
- AWS account credentials for account with Cognito user pool created and github actions role with relevant permissions
- [Postman](https://www.postman.com/) (or similar tool for hitting api)
- [Docker](https://www.docker.com/products/docker-desktop/) for running integration tests locally

### Installation

1. Clone the repository:
   Run `git clone https://github.com/Nikki9523/K9Finder.git`
   `cd K9Finder`
2. Run `npm install`
3. Set up environment variables in .env file. Environment variables needed can be seen in .env.example file.
4. Set github secrets for the required environment variables

### Setting up API
1. Import collection under postman collection\K9Finder API.postman_collection.json into Postman or similar tool
2. Generate a token using login api with valid credentials
3. Set token at top level. Endpoints are set to inherit auth from parent.

### Secret Scanning
K9Finder uses [pre-commit](https://pre-commit.com/) to run pre-commit checks before commiting to github. This is primarily used to catch secrets before exposing them on github.

To set up secret scanning pre-commit hook : 

1. Install pre-commit (requires Python):
   `pip3 install pre-commit`

2.  `pre-commit install`

3. If a secret is found a commit will be blocked until it is reviewed

4. If a valid secret is found please remove it before committing

5. If it is a false positive or test secret run:
   `detect-secrets audit .secrets.baseline`

6. Review each secret and mark as not a secret if it is a false positive

7. Save and commit .secrets.baseline

### Running lint and unit tests locally

1. Lint tests - `npm run lint`
2. Unit tests - `npm run unit`

### Running integration tests locally
1. Install Docker Desktop
2. Run Docker Desktop
3. Run `docker start dynamodb-local`
4. Run `npm run integration`

### CI/CD Pipeline

Automated testing, build and deployment are run via Github Actions pipelines.

Workflows exist in .github/workflows/.

test.yml runs on each push to an open PR or main branch.

deploy_aws_sam.yml runs following a successful run of test.yml on main branch.

performance-testing.yml workflow runs following successful run of deploy_aws_sam.yml

You can view pipeline runs and logs in the Actions tab of the GitHub repository.