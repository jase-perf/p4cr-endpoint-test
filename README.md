# P4 Code Review Webhook Demo

A simple Docker service that demonstrates automated test callbacks for P4 Code Review (formerly Helix Swarm). This service receives webhook requests, waits for a configurable delay, then reports test results back to P4 Code Review based on simple logic.

## How It Works

1. **Receives webhook**: P4 Code Review sends a POST request to this service
2. **Responds immediately**: Returns HTTP 200 to acknowledge receipt
3. **Waits**: Configurable delay (default 5 seconds) to simulate test execution
4. **Checks description**: If the description ends with a period (after trimming whitespace), the test "passes", otherwise it "fails"
5. **Reports back**: Sends the result to P4 Code Review via the update callback URL

## Prerequisites

- Docker and Docker Compose installed on your machine
- Basic familiarity with Docker commands
- Access to a P4 Code Review instance

## Quick Start

1. **Clone or download** this repository to your machine

2. **Configure the delay** (optional):
   Edit `docker-compose.yml` and change the `DELAY_SECONDS` value:
   ```yaml
   environment:
     - DELAY_SECONDS=10  # Change to desired seconds
   ```

3. **Configure host access** (if needed):
   The `extra_hosts` section in `docker-compose.yml` helps the container resolve hostnames that P4 Code Review might include in its callback URLs. Update as needed:
   ```yaml
   extra_hosts:
     - "swarm-domain:host-gateway"  # Maps Swarm's hostname to host machine
     - "example:192.168.1.120"      # Maps specific domains to IP addresses
   ```

4. **Start the service**:
   ```bash
   docker compose up --build -d
   ```
   
   The `-d` flag runs it in the background so you can continue using your terminal.

5. **Verify it's running**:
   ```bash
   curl http://localhost:3000/health
   ```
   
   You should see: `{"status":"OK","delay":5}`

## Setting Up P4 Code Review

1. **Navigate to your P4 Code Review instance** (e.g., `http://your-server/swarm`)

2. **Go to Settings** → **Tests** (or similar menu)

3. **Create a new test** with these settings:
   - **Name**: Give it a descriptive name like "Demo Webhook Test"
   - **URL**: `http://your-docker-host:3000/webhook`
     - If running locally: `http://localhost:3000/webhook`
     - If on another machine: `http://192.168.1.100:3000/webhook` (use actual IP)
   - **Body Type**: Select "URL Encoded"
   - **Body Content**: 
     ```
     updateCallback=[update]&change=[change]&description=[description]
     ```

4. **Save the test configuration**

## Testing the Demo

1. **Create a review** in P4 Code Review

2. **Try different descriptions**:
   - `"This is a test."` → Should **pass** (ends with period)
   - `"This is a test"` → Should **fail** (no period)
   - `"Build completed successfully."` → Should **pass**
   - `"Build failed"` → Should **fail**

3. **Watch the logs** to see what's happening:
   ```bash
   docker compose logs -f callback-service
   ```

## Configuration Options

### Change the Delay
Edit `DELAY_SECONDS` in `docker-compose.yml`:
```yaml
environment:
  - DELAY_SECONDS=15  # Wait 15 seconds before reporting results
```

### Configure Hostname Resolution
When P4 Code Review generates callback URLs, it may include its own hostname. The `extra_hosts` section ensures the Docker container can resolve these hostnames:

```yaml
extra_hosts:
  # If Swarm has a hostname set, it will include that in the /update endpoint,
  # so this section can help us make sure that goes to the right place.
  - "swarm-domain:host-gateway"  # Docker's special hostname for accessing localhost on the host machine
  - "example:192.168.1.120"      # Can also use this to set a specific IP for a domain name. Useful for testing.
```

## Useful Commands

```bash
# Start the service
docker compose up --build -d

# View logs
docker compose logs -f

# Stop the service
docker compose down

# Restart with new configuration
docker compose down && docker compose up --build -d

# Test the webhook manually
curl -X POST http://localhost:3000/webhook \
  -d "updateCallback=http://your-p4-server/api/v10/testruns/1/update/abc123/" \
  -d "description=Test build completed."
```

## Troubleshooting

### Service won't start
- Make sure port 3000 isn't already in use
- Check Docker is running: `docker --version`

### Can't reach P4 Code Review server
- Verify the hostname/IP in `extra_hosts`
- Test connectivity: `docker exec -it <container-name> ping p4server`

### Webhook not being called
- Verify the webhook URL in P4 Code Review settings
- Check P4 Code Review logs for connection errors
- Ensure the service is accessible from P4 Code Review server

### Tests always fail/pass
- Check the description format in P4 Code Review
- View service logs to see what description is received
- Remember: descriptions must end with a period to pass

## Files in This Repository

- `server.js` - Main webhook service code
- `package.json` - Node.js dependencies
- `Dockerfile` - Container build instructions
- `docker-compose.yml` - Service configuration
- `README.md` - This documentation

## Support

This is a demonstration tool. For production use, you would want to implement real test execution logic instead of the simple period-checking rule.