# AWS Beginner's Deployment Guide - Attendify

This click-by-click guide is designed for developers who are new to AWS. It will walk you through exactly where to go, what buttons to press, and which configurations to choose.

---

## 🗄️ Step 1: Set Up Your MySQL Database (Amazon RDS)

We will create a free-tier MySQL database instance on AWS.

1. **Log in** to your [AWS Management Console](https://console.aws.amazon.com/).
2. In the top search bar, search for **RDS** and click on it.
3. In the RDS Dashboard, click the orange **Create database** button.
4. **Choose a database creation method**: Choose **Standard create**.
5. **Engine options**: Choose **MySQL**.
6. **Templates**: Scroll down and select **Free tier** (this avoids unexpected charges).
7. **Settings**:
   - **DB instance identifier**: Type `attendify-db`.
   - **Master username**: Type `admin`.
   - **Master password**: Enter a secure password (write this down!).
8. **Connectivity**:
   - **VPC**: Leave as default.
   - **Public access**: Choose **No** (keeps database secure from internet access).
   - **VPC security group**: Choose **Create new**.
     - **New VPC security group name**: Type `attendify-db-sg`.
9. **Additional configuration** (click to expand):
   - **Initial database name**: Type `attendify`.
10. Scroll to the bottom and click **Create database**.
11. **Wait ~5 minutes** until the Status changes to **Available**.
12. Click on `attendify-db`. Under **Connectivity & security**, copy the **Endpoint** (it will look like `attendify-db.xxxx.us-east-1.rds.amazonaws.com`). This is your `DB_HOST`.

---

## ⚙️ Step 2: Prepare and Deploy Your PHP Backend (Elastic Beanstalk)

### Part A: Update Your Code
Before uploading, modify `backend/php/config.php` to load credentials dynamically. Make sure your database connection parameters match:

```php
const DB_HOST = getenv('RDS_HOSTNAME') ?: '127.0.0.1';
const DB_NAME = getenv('RDS_DB_NAME') ?: 'attendify';
const DB_USER = getenv('RDS_USERNAME') ?: 'root';
const DB_PASS = getenv('RDS_PASSWORD') ?: 'root123';
```

### Part B: Compress Backend Files (CRITICAL STEP)
Do **NOT** zip the `php` folder itself. If you do, Elastic Beanstalk will create a `/php/` directory on your server, making your API URLs look like `http://your-app.com/php/insert_attendance.php`.
1. Go to your local computer directory: `Attendify/backend/php/`.
2. Select all files *inside* the `php` folder directly (e.g. `config.php`, `insert_attendance.php`, etc., along with the `uploads` folder).
3. Right-click and choose **Compress to ZIP file** (or use Send to -> Compressed (zipped) folder). Name it `backend.zip`.

---

### Part C: Create the IAM Instance Profile (Must do this first!)
Since 2023, AWS requires you to manually assign an EC2 Instance Profile to Elastic Beanstalk. If you don't do this, deployment will fail.

1. Search for **IAM** in the top search bar and click it.
2. On the left sidebar, click **Roles**, then click **Create role**.
3. **Select trusted entity**: Choose **AWS service**.
4. **Service or use case**: Select **EC2** from the dropdown, then select **EC2** again under use case. Click **Next**.
5. **Add permissions**: In the search bar, search for and check the boxes next to the following three policies:
   - `AWSElasticBeanstalkWebTier` (allows logging and communication)
   - `AWSElasticBeanstalkWorkerTier` (used for worker instances)
   - `AWSElasticBeanstalkMulticontainerDocker` (used for docker runtime config)
6. Click **Next**.
7. **Role name**: Type `aws-elasticbeanstalk-ec2-role`.
8. Click **Create role**.

---

### Part D: Create the Elastic Beanstalk Environment
1. Search for **Elastic Beanstalk** in the top search bar and click it.
2. Click **Create application** (or **Create environment**).
3. **Configure environment**:
   - **Environment tier**: Web server environment.
   - **Application name**: Type `attendify-backend`.
   - **Environment name**: This will auto-fill as `Attendify-backend-env`.
   - **Platform**:
     - **Platform**: Select **PHP**.
     - **Platform branch**: Select **PHP 8.2** (or latest).
     - **Platform version**: Leave as default recommended.
   - **Application code**:
     - Choose **Upload your code**.
     - **Version label**: Leave as default or type `v1`.
     - **Source code origin**: Select **Local file**.
     - Click **Choose file** and select your `backend.zip` file.
   - **Preset**: Select **Single instance (free tier eligible)**.
   - Click **Next**.

4. **Configure service access (Step 2)**:
   - **Service role**: Select **Create and use new service role**.
   - **EC2 instance profile**: Click the dropdown and select the role you created in Part C: **`aws-elasticbeanstalk-ec2-role`**.
   - Click **Next**.

5. **Set up networking, database, and tags (Step 3)**:
   - **Virtual Private Cloud (VPC)**: Select your Default VPC.
   - **Subnets**: Check the box for all available subnets in the list (e.g. `us-east-1a`, `us-east-1b`, etc.).
   - **Public IP address**: Check the box for **Activated** (this allows your server to be accessible from the internet).
   - **Database**: Do **NOT** enable the database option here (we already created a separate RDS database in Step 1, which is much safer and cheaper).
   - Click **Next**.

6. **Configure instance traffic and scaling (Step 4)**:
   - **Root volume**: Leave as default.
   - **EC2 security groups**: Leave unchecked (Beanstalk will create a default one).
   - **Capacity**:
     - **Instance types**: Remove any large instances listed and search for/add `t3.micro` or `t2.micro` to stay on the free tier.
   - Click **Next**.

7. **Configure updates, monitoring, and logging (Step 5)**:
   - Scroll down to the **Environment properties** section.
   - Click **Add property** to enter your database connection details so the PHP code can read them:
     - **Name**: `RDS_HOSTNAME`  | **Value**: *(Paste the RDS Endpoint from Step 1)*
     - **Name**: `RDS_DB_NAME`   | **Value**: `attendify`
     - **Name**: `RDS_USERNAME`  | **Value**: `admin`
     - **Name**: `RDS_PASSWORD`  | **Value**: *(Your RDS master password)*
   - Click **Next**.

8. **Review (Step 6)**:
   - Review all your settings and click **Submit**.
9. **Wait ~5-10 minutes** for AWS to provision the server. Once finished, you will see a green checkmark indicating **Health: Ok**.
10. Copy the **Domain URL** shown at the top of the dashboard (e.g., `http://attendify-backend.env.elasticbeanstalk.com`). This is your backend api endpoint!

---

## 💻 Step 3: Deploy Your Frontend (AWS Amplify)

Amplify connects directly to GitHub and deploys changes automatically.

1. In the AWS Console top search bar, search for **AWS Amplify**.
2. Click **New app** -> **Host web app**.
3. Choose **GitHub** and click **Authorize**. Sign in to your GitHub account and grant access.
4. **Select Repository**: Choose your Attendify repository and select your branch (e.g., `main`). Click **Next**.
5. **App build settings**:
   Amplify needs to know how to build your project. Click **Edit** on the build configuration YAML text editor and replace the contents with:

   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - cd frontend
           - npm ci
       build:
         commands:
           # Set your production api endpoint using environment variables
           - VITE_API_BASE_URL=http://attendify-backend.env.elasticbeanstalk.com/
           - npm run build
     artifacts:
       baseDirectory: frontend/dist
       files:
         - '**/*'
     cache:
       paths:
         - frontend/node_modules/**/*
   ```
   *(Replace `http://attendify-backend.env.elasticbeanstalk.com/` with your actual Elastic Beanstalk URL).*

6. Click **Next** -> **Save and deploy**.
7. **Important Redirect Rule Configuration**:
   React Router uses client-side routing. If a user refreshes a page on paths like `/student-auth`, AWS Amplify will throw a 404 because the resource doesn't exist on the server. We need to rewrite all requests to `/index.html`:
   - On the left sidebar of your Amplify app, click **Rewrites and redirects**.
   - Click **Edit**.
   - Click **Add rule** (or edit the existing one) with these parameters:
     - **Source address**: `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|html|xml|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>`
     - **Target address**: `/index.html`
     - **Type**: `200 (Rewrite)`
   - Click **Save**.

---

## 🛡️ Step 4: Authorize Backend Security Group to access Database
Right now, the PHP backend on Elastic Beanstalk cannot connect to RDS because the RDS security group blocks inbound ports. Let's fix that:

1. Search for **EC2** in the AWS Console search bar.
2. On the left sidebar, click **Security Groups**.
3. Find your RDS Security Group (it will be the `default` one or `attendify-db-sg` if you created it) and click on it.
4. Click **Inbound rules** -> **Edit inbound rules**.
5. Select **Add rule**:
   - **Type**: Choose **MySQL/Aurora** (port 3306).
   - **Source**: Select **Custom** and search for the security group associated with your Elastic Beanstalk environment (usually named `aws-elasticbeanstalk-...`).
6. Click **Save rules**.
