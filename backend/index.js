const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// --- MIDDLEWARE ---
app.use(cors({
  origin: ["http://localhost:5173", "https://moj-projekt-test.netlify.app"], // Dodaj svoj Netlify URL ovde
  credentials: true
}));
app.use(express.json());

// --- MOCK DATABASE (Uređaji) ---
// Ovo su "pametni uređaji" u tvojoj kući.
let smartDevices = [
  { id: 1, name: "Dnevna Soba Svetlo", type: "light", isOn: false, value: 100 },
  { id: 2, name: "Ulazna Vrata", type: "lock", isLocked: true },
  { id: 3, name: "Termostat", type: "temp", value: 22, isOn: true },
  { id: 4, name: "Garaža", type: "garage", isOpen: false },
  { id: 5, name: "Muzika (Spotify)", type: "music", isOn: false, song: "Chill Lo-Fi" },
  { id: 6, name: "Roletne Spavaća", type: "blinds", value: 0 } // 0% otvoreno
];

// --- AUTH MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- RUTE ---

// 1. LOGIN
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email },
      include: { roles: { include: { role: true } } }
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Pogrešni podaci" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, roles: user.roles.map(r => r.role.name) },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: {
        email: user.email,
        firstName: user.firstName,
        roles: user.roles.map(r => r.role.name)
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// ... (importi ostaju isti)

// BRISANJE onog 'let smartDevices = [...]' - VIŠE NAM NE TREBA!

// ... (Auth middleware ostaje isti)

// --- NOVE RUTE KOJE KORISTE BAZU ---

// 1. LOGIN (Ostaje isti) - ne menjaj ga

// 2. GET DEVICES (Iz baze)
app.get("/api/devices", authenticateToken, async (req, res) => {
  try {
    const devices = await prisma.device.findMany({ orderBy: { id: 'asc' } });
    res.json(devices);
  } catch (err) {
    res.status(500).json({ error: "Greška pri čitanju uređaja" });
  }
});

// 3. TOGGLE / UPDATE DEVICE
app.post("/api/devices/:id/toggle", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { value } = req.body; // Hvatamo i novu vrednost (za slider)

  try {
    // Prvo nađi uređaj
    const device = await prisma.device.findUnique({ where: { id: parseInt(id) } });

    if (!device) return res.status(404).json({ error: "Nema uređaja" });

    // Pripremi promene
    let updates = {};

    // Ako nam je stigao 'value' (npr. temperatura), samo ažuriraj to
    if (value !== undefined) {
      updates.value = value;
    } else {
      // Inače radi klasičan toggle (pali/gasi)
      if (device.type === 'light' || device.type === 'music' || device.type === 'temp') updates.isOn = !device.isOn;
      if (device.type === 'lock') updates.isLocked = !device.isLocked;
      if (device.type === 'garage') updates.isOpen = !device.isOpen;
    }

    // Sačuvaj u bazu
    const updatedDevice = await prisma.device.update({
      where: { id: parseInt(id) },
      data: updates
    });

    res.json({ message: "Success", device: updatedDevice });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Greška na serveru" });
  }
});

// ... (Ostalo ostaje isto)

// 4. ADMIN - LIST USERS
app.get("/api/admin/users", authenticateToken, async (req, res) => {
  // Provera da li je admin
  if (!req.user.roles.includes('admin')) return res.sendStatus(403);

  const users = await prisma.user.findMany({
    select: { id: true, email: true, firstName: true, roles: { select: { role: { select: { name: true } } } } }
  });
  res.json(users);
});

app.listen(PORT, () => {
  console.log(`✅ Server sluša na portu ${PORT}`);
});