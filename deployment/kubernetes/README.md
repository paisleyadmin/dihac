# Kubernetes Deployment

This directory contains Kubernetes manifests for deploying DIHAC to cloud platforms.

## Prerequisites

- Kubernetes cluster (GKE, EKS, or AKS)
- kubectl configured
- Docker images pushed to container registry

## Deployment Steps

1. Create namespace:
```bash
kubectl create namespace dihac
```

2. Create secrets:
```bash
kubectl create secret generic dihac-secrets \
  --from-literal=mysql-password=your-password \
  --from-literal=jwt-secret=your-jwt-secret \
  -n dihac
```

3. Deploy MySQL:
```bash
kubectl apply -f mysql-deployment.yaml -n dihac
```

4. Deploy services:
```bash
kubectl apply -f user-service-deployment.yaml -n dihac
kubectl apply -f conversation-service-deployment.yaml -n dihac
kubectl apply -f analysis-service-deployment.yaml -n dihac
kubectl apply -f legal-research-service-deployment.yaml -n dihac
kubectl apply -f report-service-deployment.yaml -n dihac
kubectl apply -f evidence-service-deployment.yaml -n dihac
kubectl apply -f api-gateway-deployment.yaml -n dihac
```

5. Deploy ingress (for CDN and load balancing):
```bash
kubectl apply -f ingress.yaml -n dihac
```

## Scaling

To scale services:
```bash
kubectl scale deployment dihac-api-gateway --replicas=5 -n dihac
```

## Monitoring

Check service status:
```bash
kubectl get pods -n dihac
kubectl get services -n dihac
```

