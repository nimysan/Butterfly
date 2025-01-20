#!/bin/bash

# Enable debug output
set -x

# Exit on error
set -e

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &>/dev/null; then
    echo "Error: AWS credentials not configured. Please configure AWS credentials first."
    exit 1
fi

# Get AWS account ID and region
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=$(aws configure get region)
if [ -z "$AWS_REGION" ]; then
    AWS_REGION="us-west-2"
fi

# Create ECR repository if it doesn't exist
if ! aws ecr describe-repositories --repository-names butterfly-web-ui &>/dev/null; then
    echo "Creating ECR repository..."
    aws ecr create-repository --repository-name butterfly-web-ui
fi

# Get ECR login token
echo "Logging into ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Build Docker image
echo "Building Docker image..."
docker build -t butterfly-web-ui .

# Tag and push to ECR
echo "Tagging and pushing to ECR..."
docker tag butterfly-web-ui:latest ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/butterfly-web-ui:latest
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/butterfly-web-ui:latest

# Update Kubernetes manifests with actual values
echo "Updating Kubernetes manifests..."
sed -i.bak "s/\${AWS_ACCOUNT_ID}/${AWS_ACCOUNT_ID}/g" k8s/deployment.yaml
sed -i.bak "s/\${AWS_REGION}/${AWS_REGION}/g" k8s/deployment.yaml
rm -f k8s/deployment.yaml.bak

# Apply Kubernetes manifests
echo "Applying Kubernetes manifests..."
kubectl apply -f k8s/deployment.yaml

echo "Deployment complete! The application should be accessible at https://fly.plaza.red once DNS propagates."
