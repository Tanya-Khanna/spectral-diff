// Demo PR data model with stub data for Spectral Diff

export interface Hunk {
  id: string;
  header: string;
  added: number;
  removed: number;
  modified: number;
  importance: number;
  diffText: string;
  redFlags: string[];
  commentSuggestion: string;
  fixSnippet: string;
  testSuggestion: string;
  patchPreview: string;
}

export interface FileChange {
  path: string;
  language: string;
  risk: number; // Legacy field, now computed by risk engine
  locChanged: number;
  testsTouched: boolean;
  checksPassing: boolean;
  hunks: Hunk[];
  // New fields for risk engine
  churnScore?: number;
  isHighChurn?: boolean;
}

export interface DemoPR {
  repoName: string;
  prTitle: string;
  prNumber: number;
  files: FileChange[];
}

export const demoPR: DemoPR = {
  repoName: "spectral-org/haunted-app",
  prTitle: "feat: Add dark ritual authentication flow",
  prNumber: 666,
  files: [
    {
      path: "src/auth/ritual.ts",
      language: "typescript",
      risk: 92,
      locChanged: 847,
      testsTouched: false,
      checksPassing: false,
      hunks: [
        {
          id: "h1",
          header: "@@ -1,15 +1,89 @@ // Authentication ritual",
          added: 74,
          removed: 0,
          modified: 15,
          importance: 95,
          diffText: `+import { summonSession } from './conjure';
+import { validateOffering } from './sacrifice';
+
+export async function initiateRitual(credentials: Offering) {
+  const circle = await drawPentagram();
+  if (!circle.isSealed) {
+    throw new RitualError('Circle breach detected');
+  }
+  
+  const session = await summonSession({
+    ...credentials,
+    timestamp: Date.now(),
+    realm: 'shadow'
+  });
+  
+  return session;
+}`,
          redFlags: [
            "🔥 No input validation on credentials",
            "⚠️ Missing rate limiting",
            "👻 Hardcoded realm value"
          ],
          commentSuggestion: "The spirits whisper of unvalidated inputs... Consider adding schema validation before the ritual begins.",
          fixSnippet: `const validatedCredentials = OfferingSchema.parse(credentials);
const session = await summonSession(validatedCredentials);`,
          testSuggestion: `it('should reject malformed offerings', async () => {
  await expect(initiateRitual({})).rejects.toThrow();
});`,
          patchPreview: `--- a/src/auth/ritual.ts
+++ b/src/auth/ritual.ts
@@ -5,6 +5,8 @@ import { validateOffering } from './sacrifice';
 
 export async function initiateRitual(credentials: Offering) {
+  const validatedCredentials = OfferingSchema.parse(credentials);
   const circle = await drawPentagram();`
        },
        {
          id: "h2",
          header: "@@ -90,5 +164,25 @@ // Session management",
          added: 20,
          removed: 5,
          modified: 0,
          importance: 78,
          diffText: `+export function extendSession(token: string) {
+  // TODO: implement session extension
+  return token;
+}`,
          redFlags: ["🦴 TODO left in production code"],
          commentSuggestion: "A skeleton of code remains... This TODO may haunt future maintainers.",
          fixSnippet: `export function extendSession(token: string): string {
  const decoded = verifyToken(token);
  return signToken({ ...decoded, exp: Date.now() + SESSION_TTL });
}`,
          testSuggestion: `it('should extend valid sessions', () => {
  const extended = extendSession(validToken);
  expect(decode(extended).exp).toBeGreaterThan(Date.now());
});`,
          patchPreview: `--- a/src/auth/ritual.ts
+++ b/src/auth/ritual.ts
@@ -164,8 +164,10 @@ export function extendSession(token: string) {
-  // TODO: implement session extension
-  return token;
+  const decoded = verifyToken(token);
+  return signToken({ ...decoded, exp: Date.now() + SESSION_TTL });
 }`
        }
      ]
    },
    {
      path: "src/api/endpoints.ts",
      language: "typescript",
      risk: 68,
      locChanged: 234,
      testsTouched: true,
      checksPassing: true,
      hunks: [
        {
          id: "h3",
          header: "@@ -45,10 +45,55 @@ // API routes",
          added: 45,
          removed: 10,
          modified: 0,
          importance: 65,
          diffText: `+app.post('/api/summon', async (req, res) => {
+  const entity = await summonEntity(req.body);
+  res.json({ entity, timestamp: Date.now() });
+});
+
+app.delete('/api/banish/:id', async (req, res) => {
+  await banishEntity(req.params.id);
+  res.status(204).send();
+});`,
          redFlags: ["⚡ No error handling in route"],
          commentSuggestion: "These endpoints lack the protective wards of try-catch. Errors may escape into the void.",
          fixSnippet: `app.post('/api/summon', async (req, res, next) => {
  try {
    const entity = await summonEntity(req.body);
    res.json({ entity, timestamp: Date.now() });
  } catch (err) {
    next(err);
  }
});`,
          testSuggestion: `describe('POST /api/summon', () => {
  it('should return 500 on summoning failure', async () => {
    const res = await request(app).post('/api/summon').send({});
    expect(res.status).toBe(500);
  });
});`,
          patchPreview: `--- a/src/api/endpoints.ts
+++ b/src/api/endpoints.ts
@@ -45,7 +45,12 @@
-app.post('/api/summon', async (req, res) => {
+app.post('/api/summon', async (req, res, next) => {
+  try {
     const entity = await summonEntity(req.body);
     res.json({ entity, timestamp: Date.now() });
+  } catch (err) {
+    next(err);
+  }
 });`
        }
      ]
    },
    {
      path: "src/components/Portal.tsx",
      language: "tsx",
      risk: 45,
      locChanged: 156,
      testsTouched: true,
      checksPassing: true,
      hunks: [
        {
          id: "h4",
          header: "@@ -1,20 +1,45 @@ // Portal component",
          added: 25,
          removed: 0,
          modified: 20,
          importance: 42,
          diffText: `+export function Portal({ children, realm }: PortalProps) {
+  const [isOpen, setIsOpen] = useState(false);
+  
+  return (
+    <div className="portal-frame">
+      <AnimatePresence>
+        {isOpen && (
+          <motion.div className="portal-content">
+            {children}
+          </motion.div>
+        )}
+      </AnimatePresence>
+    </div>
+  );
+}`,
          redFlags: [],
          commentSuggestion: "A well-crafted portal. The spirits approve of this component structure.",
          fixSnippet: "",
          testSuggestion: "",
          patchPreview: ""
        }
      ]
    },
    {
      path: "src/utils/crypt.ts",
      language: "typescript",
      risk: 85,
      locChanged: 312,
      testsTouched: false,
      checksPassing: false,
      hunks: [
        {
          id: "h5",
          header: "@@ -1,5 +1,78 @@ // Cryptographic utilities",
          added: 73,
          removed: 0,
          modified: 5,
          importance: 88,
          diffText: `+import crypto from 'crypto';
+
+const ALGORITHM = 'aes-256-gcm';
+const SECRET = process.env.CRYPT_SECRET || 'default-secret';
+
+export function encrypt(plaintext: string): string {
+  const iv = crypto.randomBytes(16);
+  const cipher = crypto.createCipheriv(ALGORITHM, SECRET, iv);
+  // ... encryption logic
+}`,
          redFlags: [
            "💀 Hardcoded fallback secret",
            "🔐 Missing key derivation",
            "⚠️ No tests for crypto code"
          ],
          commentSuggestion: "Dark secrets should never have defaults. This fallback key is a grave vulnerability.",
          fixSnippet: `const SECRET = process.env.CRYPT_SECRET;
if (!SECRET) {
  throw new Error('CRYPT_SECRET must be set');
}`,
          testSuggestion: `it('should throw without CRYPT_SECRET', () => {
  delete process.env.CRYPT_SECRET;
  expect(() => encrypt('test')).toThrow();
});`,
          patchPreview: `--- a/src/utils/crypt.ts
+++ b/src/utils/crypt.ts
@@ -3,7 +3,10 @@ import crypto from 'crypto';
 
 const ALGORITHM = 'aes-256-gcm';
-const SECRET = process.env.CRYPT_SECRET || 'default-secret';
+const SECRET = process.env.CRYPT_SECRET;
+if (!SECRET) {
+  throw new Error('CRYPT_SECRET must be set');
+}`
        },
        {
          id: "h6",
          header: "@@ -80,10 +153,35 @@ // Decryption",
          added: 25,
          removed: 10,
          modified: 0,
          importance: 72,
          diffText: `+export function decrypt(ciphertext: string): string {
+  const [ivHex, encrypted] = ciphertext.split(':');
+  const iv = Buffer.from(ivHex, 'hex');
+  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET, iv);
+  // ... decryption logic
+}`,
          redFlags: ["⚠️ No input validation on ciphertext format"],
          commentSuggestion: "The ciphertext parsing assumes a specific format. Malformed input could raise the dead (errors).",
          fixSnippet: `export function decrypt(ciphertext: string): string {
  if (!ciphertext.includes(':')) {
    throw new Error('Invalid ciphertext format');
  }
  const [ivHex, encrypted] = ciphertext.split(':');
  // ...
}`,
          testSuggestion: `it('should reject malformed ciphertext', () => {
  expect(() => decrypt('invalid')).toThrow('Invalid ciphertext format');
});`,
          patchPreview: `--- a/src/utils/crypt.ts
+++ b/src/utils/crypt.ts
@@ -153,6 +153,9 @@
 export function decrypt(ciphertext: string): string {
+  if (!ciphertext.includes(':')) {
+    throw new Error('Invalid ciphertext format');
+  }
   const [ivHex, encrypted] = ciphertext.split(':');`
        }
      ]
    },
    {
      path: "styles/theme.css",
      language: "css",
      risk: 12,
      locChanged: 45,
      testsTouched: false,
      checksPassing: true,
      hunks: [
        {
          id: "h7",
          header: "@@ -1,10 +1,25 @@ /* Theme variables */",
          added: 15,
          removed: 0,
          modified: 10,
          importance: 15,
          diffText: `:root {
+  --shadow-deep: #0a0a0f;
+  --shadow-medium: #1a1a2e;
+  --glow-primary: #7c3aed;
+  --glow-danger: #dc2626;
+}`,
          redFlags: [],
          commentSuggestion: "Pleasant color choices for the dark realm.",
          fixSnippet: "",
          testSuggestion: "",
          patchPreview: ""
        }
      ]
    },
    {
      path: "README.md",
      language: "markdown",
      risk: 5,
      locChanged: 23,
      testsTouched: false,
      checksPassing: true,
      hunks: [
        {
          id: "h8",
          header: "@@ -1,5 +1,15 @@ # Project",
          added: 10,
          removed: 0,
          modified: 5,
          importance: 5,
          diffText: `+# Haunted App
+
+A spooky application for managing supernatural entities.
+
+## Getting Started
+\`\`\`bash
+pnpm install
+pnpm dev
+\`\`\``,
          redFlags: [],
          commentSuggestion: "Documentation is always welcome in the crypt.",
          fixSnippet: "",
          testSuggestion: "",
          patchPreview: ""
        }
      ]
    },
    // CRITICAL: Workflow file with security issues
    {
      path: ".github/workflows/ci.yml",
      language: "yaml",
      risk: 100, // Will be computed as very high
      locChanged: 85,
      testsTouched: false,
      checksPassing: true,
      isHighChurn: false,
      hunks: [
        {
          id: "h9",
          header: "@@ -1,10 +1,45 @@ # CI Workflow",
          added: 35,
          removed: 0,
          modified: 10,
          importance: 100,
          diffText: `+name: CI Pipeline
+
+on:
+  pull_request_target:
+    branches: [main]
+
+permissions: write-all
+
+jobs:
+  build:
+    runs-on: ubuntu-latest
+    steps:
+      - uses: actions/checkout@v3
+      - uses: actions/setup-node@main
+      - uses: some-org/dangerous-action@master
+      
+      - name: Install deps
+        run: npm ci
+      
+      - name: Build
+        run: npm run build`,
          redFlags: [
            "💀 CRITICAL: pull_request_target with write-all permissions",
            "🔓 Unpinned actions (@v3, @main, @master)",
            "⚠️ Broad permissions granted"
          ],
          commentSuggestion: "This workflow is a portal to the shadow realm. pull_request_target with write-all permissions allows attackers to execute arbitrary code with full repo access.",
          fixSnippet: `on:
  pull_request:
    branches: [main]

permissions:
  contents: read

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@8ade135a41bc03ea155e62e844d188df1ea18608
      - uses: actions/setup-node@1a4442cacd436585916779262731d5b162bc6ec7`,
          testSuggestion: "",
          patchPreview: `--- a/.github/workflows/ci.yml
+++ b/.github/workflows/ci.yml
@@ -3,15 +3,15 @@ name: CI Pipeline
 on:
-  pull_request_target:
+  pull_request:
     branches: [main]
 
-permissions: write-all
+permissions:
+  contents: read
 
 jobs:
   build:
     runs-on: ubuntu-latest
     steps:
-      - uses: actions/checkout@v3
-      - uses: actions/setup-node@main
+      - uses: actions/checkout@8ade135a41bc03ea155e62e844d188df1ea18608
+      - uses: actions/setup-node@1a4442cacd436585916779262731d5b162bc6ec7`
        },
        {
          id: "h10",
          header: "@@ -50,5 +85,20 @@ # Deploy job",
          added: 15,
          removed: 5,
          modified: 0,
          importance: 90,
          diffText: `+  deploy:
+    needs: build
+    runs-on: ubuntu-latest
+    permissions:
+      contents: write
+      packages: write
+    steps:
+      - uses: actions/checkout@v3
+      - name: Deploy
+        run: ./deploy.sh
+        env:
+          DEPLOY_TOKEN: \${{ secrets.DEPLOY_TOKEN }}`,
          redFlags: [
            "🔓 Unpinned action in deploy job",
            "⚠️ Multiple write permissions"
          ],
          commentSuggestion: "The deploy job grants excessive permissions. Consider using OIDC for cloud deployments instead of long-lived tokens.",
          fixSnippet: `  deploy:
    needs: build
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write  # For OIDC
    steps:
      - uses: actions/checkout@8ade135a41bc03ea155e62e844d188df1ea18608`,
          testSuggestion: "",
          patchPreview: ""
        }
      ]
    },
    // Dependency file
    {
      path: "package.json",
      language: "json",
      risk: 35,
      locChanged: 28,
      testsTouched: false,
      checksPassing: true,
      isHighChurn: true,
      churnScore: 75,
      hunks: [
        {
          id: "h11",
          header: "@@ -15,5 +15,20 @@ dependencies",
          added: 15,
          removed: 0,
          modified: 5,
          importance: 45,
          diffText: `+  "dependencies": {
+    "express": "^4.18.2",
+    "lodash": "^4.17.21",
+    "axios": "^1.6.0",
+    "jsonwebtoken": "^9.0.0",
+    "bcrypt": "^5.1.1"
+  },
+  "devDependencies": {
+    "typescript": "^5.3.0",
+    "vitest": "^1.0.0"
+  }`,
          redFlags: [
            "📦 New dependencies added",
            "🔐 Security-sensitive package: jsonwebtoken"
          ],
          commentSuggestion: "New dependencies detected. Verify these packages are from trusted sources and check for known vulnerabilities.",
          fixSnippet: "",
          testSuggestion: "",
          patchPreview: ""
        }
      ]
    },
    // Payment-related file (sensitive path)
    {
      path: "src/payments/processor.ts",
      language: "typescript",
      risk: 75,
      locChanged: 180,
      testsTouched: false,
      checksPassing: true,
      isHighChurn: false,
      hunks: [
        {
          id: "h12",
          header: "@@ -1,10 +1,65 @@ // Payment processor",
          added: 55,
          removed: 0,
          modified: 10,
          importance: 85,
          diffText: `+import Stripe from 'stripe';
+
+const stripe = new Stripe(process.env.STRIPE_KEY!);
+
+export async function processPayment(amount: number, token: string) {
+  if (amount <= 0) {
+    throw new Error('Invalid amount');
+  }
+  
+  const charge = await stripe.charges.create({
+    amount: Math.round(amount * 100),
+    currency: 'usd',
+    source: token,
+  });
+  
+  return charge;
+}
+
+export async function refundPayment(chargeId: string) {
+  const refund = await stripe.refunds.create({
+    charge: chargeId,
+  });
+  return refund;
+}`,
          redFlags: [
            "💰 Payment processing code without tests",
            "⚠️ No idempotency key for charges",
            "🔐 Sensitive financial operations"
          ],
          commentSuggestion: "Payment code demands the highest scrutiny. Consider adding idempotency keys to prevent duplicate charges.",
          fixSnippet: `const charge = await stripe.charges.create({
  amount: Math.round(amount * 100),
  currency: 'usd',
  source: token,
  idempotency_key: generateIdempotencyKey(),
});`,
          testSuggestion: `describe('processPayment', () => {
  it('should reject negative amounts', async () => {
    await expect(processPayment(-100, 'tok_test')).rejects.toThrow('Invalid amount');
  });
  
  it('should create charge with correct amount', async () => {
    const charge = await processPayment(50, 'tok_visa');
    expect(charge.amount).toBe(5000);
  });
});`,
          patchPreview: ""
        }
      ]
    }
  ]
};

// Helper functions
export function getDarkestRoom(files: FileChange[]): FileChange | null {
  if (files.length === 0) return null;
  return files.reduce((darkest, file) => 
    file.risk > darkest.risk ? file : darkest
  );
}

export function getFilesSortedByRisk(files: FileChange[]): FileChange[] {
  return [...files].sort((a, b) => b.risk - a.risk);
}

export function getAllHunksSorted(files: FileChange[]): { file: FileChange; hunk: Hunk }[] {
  const sortedFiles = getFilesSortedByRisk(files);
  const allHunks: { file: FileChange; hunk: Hunk }[] = [];
  
  for (const file of sortedFiles) {
    const sortedHunks = [...file.hunks].sort((a, b) => b.importance - a.importance);
    for (const hunk of sortedHunks) {
      allHunks.push({ file, hunk });
    }
  }
  
  return allHunks;
}

export interface LanternCursor {
  fileIndex: number;
  hunkIndex: number;
}

export function getNextHunkCursor(
  files: FileChange[],
  current: LanternCursor
): LanternCursor | null {
  const allHunks = getAllHunksSorted(files);
  const currentGlobalIndex = allHunks.findIndex(
    (h, i) => {
      let count = 0;
      for (let fi = 0; fi < files.length; fi++) {
        for (let hi = 0; hi < files[fi].hunks.length; hi++) {
          if (fi === current.fileIndex && hi === current.hunkIndex) {
            return i === count;
          }
          count++;
        }
      }
      return false;
    }
  );
  
  if (currentGlobalIndex === -1 || currentGlobalIndex >= allHunks.length - 1) {
    return null;
  }
  
  const next = allHunks[currentGlobalIndex + 1];
  const fileIndex = files.findIndex(f => f.path === next.file.path);
  const hunkIndex = files[fileIndex].hunks.findIndex(h => h.id === next.hunk.id);
  
  return { fileIndex, hunkIndex };
}

export function getPrevHunkCursor(
  files: FileChange[],
  current: LanternCursor
): LanternCursor | null {
  const allHunks = getAllHunksSorted(files);
  let currentGlobalIndex = -1;
  let count = 0;
  
  outer: for (let fi = 0; fi < files.length; fi++) {
    for (let hi = 0; hi < files[fi].hunks.length; hi++) {
      if (fi === current.fileIndex && hi === current.hunkIndex) {
        currentGlobalIndex = count;
        break outer;
      }
      count++;
    }
  }
  
  if (currentGlobalIndex <= 0) {
    return null;
  }
  
  const prev = allHunks[currentGlobalIndex - 1];
  const fileIndex = files.findIndex(f => f.path === prev.file.path);
  const hunkIndex = files[fileIndex].hunks.findIndex(h => h.id === prev.hunk.id);
  
  return { fileIndex, hunkIndex };
}

export function getTotalHunks(files: FileChange[]): number {
  return files.reduce((sum, file) => sum + file.hunks.length, 0);
}

export function getCurrentHunkNumber(files: FileChange[], cursor: LanternCursor): number {
  let count = 0;
  for (let fi = 0; fi < files.length; fi++) {
    for (let hi = 0; hi < files[fi].hunks.length; hi++) {
      count++;
      if (fi === cursor.fileIndex && hi === cursor.hunkIndex) {
        return count;
      }
    }
  }
  return count;
}
