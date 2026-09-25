# DevOps Deployment Guide

## PHASE 1: LOCAL BUILD

### 1. Configure Backend Environment

```bash
cd backend
echo "PORT=4000" > .env
echo 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/worldofnovel_db"' >> .env
echo 'JWT_SECRET="your_secret"' >> .env
echo 'FRONTEND_URL="http://localhost:5173"' >> .env
```

### 2. Build Backend

```bash
cd backend
npm install
npx prisma generate
npm run build
```

### 3. Build Frontend

```bash
cd ../frontend
npm install
npm run build
```

---

## PHASE 2: DOCKER IMAGE CREATION

### 1. Create Backend Dockerfile

Create `backend/Dockerfile`:

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
```

### 2. Create Frontend Nginx Configuration

Create `frontend/nginx.conf`:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://backend:4000;
    }
}
```

### 3. Create Frontend Dockerfile

Create `frontend/Dockerfile`:

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## PHASE 3: SOURCE CONTROL & REPOSITORY

### 1. Initialize and Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/worldofnovel.git
git branch -M main
git push -u origin main
```

---

## PHASE 4: CLOUD INFRASTRUCTURE (TERRAFORM)

### 1. Authenticate with Azure

```bash
az login
```

### 2. Create Terraform Configuration

Create `terraform/main.tf`:

```hcl
provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "rg" {
  name     = "rg-worldofnovel-prod"
  location = "East US"
}

resource "azurerm_container_registry" "acr" {
  name                = "acrworldofnovelprod"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  sku                 = "Standard"
  admin_enabled       = true
}

resource "azurerm_log_analytics_workspace" "logs" {
  name                = "logs-worldofnovel"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  sku                 = "PerGB2018"
}

resource "azurerm_kubernetes_cluster" "aks" {
  name                = "aks-worldofnovel-prod"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  dns_prefix          = "worldofnovel"

  default_node_pool {
    name       = "default"
    node_count = 1
    vm_size    = "Standard_B2s"
  }

  identity {
    type = "SystemAssigned"
  }

  oms_agent {
    log_analytics_workspace_id = azurerm_log_analytics_workspace.logs.id
  }
}

resource "azurerm_role_assignment" "aks_to_acr" {
  principal_id                     = azurerm_kubernetes_cluster.aks.kubelet_identity[0].object_id
  role_definition_name             = "AcrPull"
  scope                            = azurerm_container_registry.acr.id
  skip_service_principal_aad_check = true
}
```

### 3. Deploy Infrastructure

```bash
cd terraform
terraform init
terraform apply -auto-approve
```

---

## PHASE 5: CONTINUOUS INTEGRATION (GITHUB ACTIONS)

### 1. Retrieve Azure Registry Credentials

```bash
az acr credential show -n acrworldofnovelprod
```

### 2. Add GitHub Repository Secrets

Navigate to **GitHub Repository > Settings > Secrets and variables > Actions > New repository secret**:

* `ACR_LOGIN_SERVER`: (from step 1 output, e.g., `acrworldofnovelprod.azurecr.io`)
* `ACR_USERNAME`: (from step 1 output)
* `ACR_PASSWORD`: (from step 1 output)

### 3. Create GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ "main" ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: azure/docker-login@v1
        with:
          login-server: ${{ secrets.ACR_LOGIN_SERVER }}
          username: ${{ secrets.ACR_USERNAME }}
          password: ${{ secrets.ACR_PASSWORD }}

      - run: |
          docker build -t ${{ secrets.ACR_LOGIN_SERVER }}/worldofnovel-backend:latest ./backend
          docker push ${{ secrets.ACR_LOGIN_SERVER }}/worldofnovel-backend:latest

      - run: |
          docker build -t ${{ secrets.ACR_LOGIN_SERVER }}/worldofnovel-frontend:latest ./frontend
          docker push ${{ secrets.ACR_LOGIN_SERVER }}/worldofnovel-frontend:latest
```

### 4. Trigger Automatic Deployment

```bash
git add .
git commit -m "Add CI/CD pipeline"
git push
```

---

## PHASE 6: DEPLOY TO KUBERNETES

### 1. Authenticate Kubernetes

```bash
az aks get-credentials --resource-group rg-worldofnovel-prod --name aks-worldofnovel-prod
```

### 2. Create Kubernetes Manifest

Create `kubernetes/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: worldofnovel-backend
spec:
  replicas: 1
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: acrworldofnovelprod.azurecr.io/worldofnovel-backend:latest
        ports:
        - containerPort: 4000
        env:
        - name: DATABASE_URL
          value: "postgresql://postgres:postgres@your_production_database_url_here"

---
apiVersion: v1
kind: Service
metadata:
  name: backend
spec:
  selector:
    app: backend
  ports:
    - port: 4000
      targetPort: 4000

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: worldofnovel-frontend
spec:
  replicas: 1
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: acrworldofnovelprod.azurecr.io/worldofnovel-frontend:latest
        ports:
        - containerPort: 80

---
apiVersion: v1
kind: Service
metadata:
  name: frontend
  type: LoadBalancer 
spec:
  selector:
    app: frontend
  ports:
    - port: 80
      targetPort: 80
```

### 3. Deploy and Access Application

```bash
kubectl apply -f kubernetes/deployment.yaml
kubectl get services
```

*Copy the `EXTERNAL-IP` of the `frontend` service to visit the deployed application.*
