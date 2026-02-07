# 1️⃣ Base image
FROM node:20-alpine

# 2️⃣ App directory
WORKDIR /app

# 3️⃣ Install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# 4️⃣ Copy app source
COPY . .

# 5️⃣ Environment
ENV NODE_ENV=production

# 6️⃣ Port expose (change if needed)
EXPOSE 5000

# 7️⃣ Start app
CMD ["node", "server.js"]
