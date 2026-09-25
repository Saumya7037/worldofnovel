# WorldOfNovel — Absolute Beginner Azure Deployment Guide

This guide is designed for **complete beginners** and is **custom-tailored perfectly for your exact project**. Do not try to guess names or variables—you can literally **copy and paste** exactly what is written below into your terminal to deploy your application to Azure!

**Pre-requisite:** We assume your application code works locally using `npm run dev`. You must have created accounts on **GitHub** and **Microsoft Azure**, and installed **Git, Docker, Terraform, NodeJS, kubectl, and Azure CLI** on your PC.

---

## Phase 1: Local Verification with Docker

**Goal:** Your app is currently using two Dockerfiles and a `docker-compose.yml` file. Let's make sure it runs on your PC.

### Step 1: Run the Docker Compose Command

Open your terminal in `C:\Users\saumy\OneDrive\Desktop\cloudengineer\my_new_project` and run:

```bash
docker-compose up -d --build
```

**Expected Output:** Once it finishes building the images, go to `http://localhost:8080` in your web browser. You should see your website. Once you verify it works, stop the local server by running:

```bash
docker-compose down
```

---

## Phase 2: Create a GitHub Repository

**Goal:** Push your local code to GitHub securely.

### Step 1: Create a blank repository on GitHub.com

1. Go to `https://github.com/new` in your browser.
2. Enter the repository name: `worldofnovel`.
3. Select **Private** (or Public, whichever you prefer).
4. Click the green **Create repository** button.
5. On the next screen, you will see your repository URL (it looks like `https://github.com/YourUsername/worldofnovel.git`). **Copy this URL.**

### Step 2: Push your code to GitHub

Run these commands in your Windows terminal exactly as written. **Make sure to replace the placeholder URL below with the URL you copied in Step 1!**

```bash
git init
git add .
git commit -m "Initial commit for Azure Deployment"
git branch -M main
git remote add origin https://github.com/YourUsername/worldofnovel.git
git push -u origin main
```

---

## Phase 3: Creating the Servers in Azure

**Goal:** Create an Azure PostgreSQL Database and a Kubernetes Server automatically. We have hardcoded explicit, unique names and passwords for you so you can just copy-paste this!

### Step 1: Log in to Azure

Run this command in your terminal:

```bash
az login
```

*A web browser will pop up. Log in to your Azure account. Once the terminal prints "Welcome to Azure", you can proceed.*

### Step 2: Write the Infrastructure Code

Create a new folder named `terraform` in your project folder, and inside it make a file named `main.tf`. Copy-paste this strictly tailored code into the file exactly as it appears:

```hcl
provider "azurerm" { features {} }

resource "azurerm_resource_group" "rg" {
  name     = "rg-worldofnovel-saumyak"
  location = "East US"
}

# 1. Managed PostgreSQL Server 
resource "azurerm_postgresql_flexible_server" "db" {
  name                   = "psql-worldofnovel-saumyak-2026"
  resource_group_name    = azurerm_resource_group.rg.name
  location               = azurerm_resource_group.rg.location
  version                = "15"
  administrator_login    = "novel_admin"
  administrator_password = "Nov3lDBP@ssw0rd2026!" 
  zone                   = "1"
  storage_mb             = 32768
  sku_name               = "B_Standard_B1ms"
}

# Allow Azure Services to communicate with this DB Server
resource "azurerm_postgresql_flexible_server_firewall_rule" "allow_aks" {
  name             = "allow_aks_access"
  server_id        = azurerm_postgresql_flexible_server.db.id
  start_ip_address = "0.0.0.0" 
  end_ip_address   = "0.0.0.0"
}

# Create actual database inside the Server
resource "azurerm_postgresql_flexible_server_database" "app_db" {
  name      = "worldofnovel_db"
  server_id = azurerm_postgresql_flexible_server.db.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

# 2. Azure Container Registry 
resource "azurerm_container_registry" "acr" {
  name                = "acrworldofnovelsaumyak2026"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  sku                 = "Standard"
  admin_enabled       = true
}

# 3. Azure Logs Workspace 
resource "azurerm_log_analytics_workspace" "logs" {
  name                = "logsworldofnovelsaumyak"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  sku                 = "PerGB2018"
}

# 4. Azure Kubernetes Service (AKS)
resource "azurerm_kubernetes_cluster" "aks" {
  name                = "aks-worldofnovel-saumyak"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  dns_prefix          = "worldofnovel"

  default_node_pool {
    name       = "default"
    node_count = 1
    vm_size    = "Standard_B2s"
  }
  identity { type = "SystemAssigned" }
  oms_agent {
    log_analytics_workspace_id = azurerm_log_analytics_workspace.logs.id
  }
}

# Grant Kubernetes permission to pull Docker Images from the Registry
resource "azurerm_role_assignment" "aks_to_acr" {
  principal_id                     = azurerm_kubernetes_cluster.aks.kubelet_identity[0].object_id
  role_definition_name             = "AcrPull"
  scope                            = azurerm_container_registry.acr.id
  skip_service_principal_aad_check = true
}
```

### Step 3: Check and Deploy The Code to Azure

Run these commands completely literally exactly as they appear in your terminal:

```bash
cd terraform
terraform init
terraform apply -auto-approve
cd ..
```

**Wait for this to finish! It takes exactly ~10 minutes.**

---

## Phase 4: Setting up GitHub Secrets

**Goal:** Every time you push code to GitHub, GitHub will automatically ask Azure to store your Docker images. We need to save the Azure usernames and passwords safely in GitHub to allow this.

### Step 1: Getting your Azure Container Registry (ACR) Password

We need the Username and Password for the `acrworldofnovelsaumyak2026` registry you just created in Terraform.

1. Run this exact command in your terminal:

   ```bash
   az acr credential show --name acrworldofnovelsaumyak2026
   ```

2. The terminal will print a dictionary structure containing `"username"` and `"passwords"`. Look for `"value":` under `passwords`. Carefully highlight the password without quotes, right-click, and copy it!

### Step 2: Saving the secrets into the GitHub Website

1. Go to your GitHub repository in the web browser (e.g., `https://github.com/YourUsername/worldofnovel`).
2. Click the **Settings** tab located at the top right of your repository page.
3. On the left sidebar menu, scroll down to the **Security** section. Click on **Secrets and variables**, and then select **Actions**.
4. Click the big green button in the middle of the screen that says **New repository secret**.
5. You must create 3 distinct secrets exactly like this:
   * **First Secret:**
     * **Name:** `ACR_LOGIN_SERVER`
     * **Secret:** `acrworldofnovelsaumyak2026.azurecr.io`
     * *(Click Add Secret! Then click New Repository secret again!)*
   * **Second Secret:**
     * **Name:** `ACR_USERNAME`
     * **Secret:** `acrworldofnovelsaumyak2026`
     * *(Click Add Secret! Then click New Repository secret again!)*
   * **Third Secret:**
     * **Name:** `ACR_PASSWORD`
     * **Secret:** *Paste the password value you copied in Step 1 from your terminal.*
     * *(Click Add Secret!)*

---

## Phase 5: Run GitHub Actions

**Goal:** Add a workflow tracking file so GitHub notices your project and compiles everything for you.

### Step 1: Create the GitHub Actions Pipeline

In your project folder `my_new_project`, create a folder named `.github` (note the dot). Inside `.github`, create a folder named `workflows`. Inside `workflows`, create a file named `deploy.yml`.
*(Full Path: `my_new_project/.github/workflows/deploy.yml`)*

Copy-paste this exactly:

```yaml
name: Build and Push to Azure

on:
  push:
    branches: [ "main" ]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
          
      - uses: azure/docker-login@v1
        with:
          login-server: ${{ secrets.ACR_LOGIN_SERVER }}
          username: ${{ secrets.ACR_USERNAME }}
          password: ${{ secrets.ACR_PASSWORD }}
          
      - name: Build and push backend
        run: |
          docker build -t ${{ secrets.ACR_LOGIN_SERVER }}/worldofnovel-backend:${{ github.sha }} ./backend
          docker push ${{ secrets.ACR_LOGIN_SERVER }}/worldofnovel-backend:${{ github.sha }}

      - name: Build and push frontend
        run: |
          docker build -t ${{ secrets.ACR_LOGIN_SERVER }}/worldofnovel-frontend:${{ github.sha }} ./frontend
          docker push ${{ secrets.ACR_LOGIN_SERVER }}/worldofnovel-frontend:${{ github.sha }}
      
      - name: Update Kubernetes Manifests
        run: |
          sed -i "s|worldofnovel-backend:.*|worldofnovel-backend:${{ github.sha }}|" kubernetes/deployment.yaml
          sed -i "s|worldofnovel-frontend:.*|worldofnovel-frontend:${{ github.sha }}|" kubernetes/deployment.yaml
          git config user.name "GitHub Action"
          git config user.email "action@github.com"
          git add kubernetes/deployment.yaml
          git commit -m "Update image tags to ${{ github.sha }}"
          git push
```

**Step 2: Upload pipeline to GitHub!**
Run this in your terminal:

```bash
git add .
git commit -m "Add GitHub Actions Deployment Pipeline"
git push
```

**Open GitHub!** Go to your repository on GitHub. Click the **Actions** tab at the top. You will see an orange spinning circle indicating your project is building! Wait a few minutes until it becomes a green checkmark!

---

## Phase 6: Automatic Kubernetes Deployment (ArgoCD)

**Goal:** Automate our Kubernetes infrastructure.

### Step 1: Connect your Terminal to your new Kubernetes Server

Run this exact command in the terminal to securely link your PC to your new Azure cluster you created in Phase 3!

```bash
az aks get-credentials --resource-group rg-worldofnovel-saumyak --name aks-worldofnovel-saumyak
```

### Step 2: Push your Database Password to Kubernetes

Your web application needs passwords to know how to connect to Postgres remotely. We have mapped the identical configuration from Terraform here. Run this single block of code precisely:

```bash
kubectl create secret generic backend-secrets \
  --from-literal=JWT_SECRET="JWT_SuperSecretDevKey2026!" \
  --from-literal=DATABASE_URL="postgresql://novel_admin:Nov3lDBP@ssw0rd2026!@psql-worldofnovel-saumyak-2026.postgres.database.azure.com:5432/worldofnovel_db?sslmode=require"
```

### Step 3: Install ArgoCD Application

Run these two commands exactly as they are to install the ArgoCD tracking robot inside your Azure Server:

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

### Step 4: Map ArgoCD to your Code

Create a fast folder named `kubernetes` in your main project folder. Create `deployment.yaml` inside it:
*File: `kubernetes/deployment.yaml`*:

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
        image: acrworldofnovelsaumyak2026.azurecr.io/worldofnovel-backend:latest
        ports:
        - containerPort: 4000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: backend-secrets
              key: DATABASE_URL
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
        image: acrworldofnovelsaumyak2026.azurecr.io/worldofnovel-frontend:latest
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

Now, write exactly one more file inside your root project folder called `argocd-app.yaml`:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: worldofnovel
  namespace: argocd
spec:
  project: default
  source:
    repoURL: 'https://github.com/YourUsername/worldofnovel.git'
    targetRevision: main
    path: kubernetes
  destination:
    server: 'https://kubernetes.default.svc'
    namespace: default
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

**Start the Tracker inside Kubernetes!**

```bash
kubectl apply -f argocd-app.yaml
```

---

## Phase 7: See The Live Website and Argo UI

1. **Forward the ArgoCD Website to your PC:**
   Run this in your terminal (Leave the terminal open afterwards! Do not close it!)

   ```bash
   kubectl port-forward svc/argocd-server -n argocd 8080:443
   ```

2. **Find the Secret Admin Password:**
   Open a **second, new powershell terminal window** and run this command:

   ```bash
   kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}"
   ```

   **READ CAREFULLY:** Because you are on Windows, the output is encoded in Base64 (it will look like a long string of random characters ending in `==`).
   * Copy that entire random string.
   * Go to `https://www.base64decode.org/` in your browser.
   * Paste the random string into the box and click **DECODE**.
   * The text that prints out at the bottom is your real, usable password!

3. **Login:**
   Open your web browser and go to `https://localhost:8080`.
   Bypass the security warning (Click Advanced -> Proceed to localhost (unsafe)).
   In the **Username** field, type: `admin`
   In the **Password** field, paste the real password you just decoded from the website!
   You will now see the Argo UI deploying your app!

4. **Get the live Internet IP for your Website Application!!**
   In your secondary terminal, run:

   ```bash
   kubectl get svc frontend
   ```

   Look for the column titled **EXTERNAL-IP**. Give it 3 minutes. Run the command repeatedly until it displays a real IP Address, copy and paste that address into your web browser.

**Congratulations! Your application is officially hosted on Microsoft Azure cloud!**
