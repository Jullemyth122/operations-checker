FROM node:22

# Set working directory inside the container
WORKDIR /app

# Copy only package files first (better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your code
COPY . .

# Expose the port Vite uses [5173] or other ports
# EXPOSE 5173 
EXPOSE 420

# Start the dev server (this is what "npm run dev" does)
CMD ["npm", "run", "dev", "--", "--host"]