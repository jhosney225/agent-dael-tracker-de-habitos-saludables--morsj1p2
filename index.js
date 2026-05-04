
```javascript
const Anthropic = require("@anthropic-ai/sdk");
const readline = require("readline");
const fs = require("fs");

const client = new Anthropic();

// Archivo para persistencia de datos
const DATA_FILE = "habits_data.json";

// Cargar datos existentes o inicializar
function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    const data = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(data);
  }
  return {
    habits: [],
    logs: [],
  };
}

// Guardar datos
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Crear interfaz de readline
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Función para hacer preguntas
function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

// Función para mostrar menú principal
function showMainMenu() {
  console.log("\n=== TRACKER DE HÁBITOS SALUDABLES ===");
  console.log("1. Agregar nuevo hábito");
  console.log("2. Registrar progreso");
  console.log("3. Ver estadísticas");
  console.log("4. Obtener recomendaciones con IA");
  console.log("5. Listar hábitos");
  console.log("6. Salir");
}

// Agregar nuevo hábito
function addHabit(data, habitName, habitCategory) {
  const habit = {
    id: Date.now(),
    name: habitName,
    category: habitCategory,
    created: new Date().toISOString(),
    logs: [],
  };
  data.habits.push(habit);
  saveData(data);
  console.log(`✓ Hábito "${habitName}" agregado exitosamente`);
  return habit;
}

// Registrar progreso
function logProgress(data, habitId, completed, notes = "") {
  const habit = data.habits.find((h) => h.id === habitId);
  if (!habit) {
    console.log("Hábito no encontrado");
    return false;
  }

  const log = {
    id: Date.now(),
    habitId,
    date: new Date().toISOString(),
    completed,
    notes,
  };

  habit.logs.push(log);
  saveData(data);
  console.log(
    `✓ Progreso registrado: ${completed ? "Completado" : "No completado"}`
  );
  return true;
}

// Calcular estadísticas
function getStatistics(data) {
  const stats = {};

  data.habits.forEach((habit) => {
    const totalLogs = habit.logs.length;
    const completedLogs = habit.logs.filter((l) => l.completed).length;
    const completionRate = totalLogs > 0 ? (completedLogs / totalLogs) * 100 : 0;
    const daysActive = new Set(
      habit.logs.map((l) => l.date.split("T")[0])
    ).size;

    stats[habit.name] = {
      category: habit.category,
      totalLogs,
      completedLogs,
      completionRate: completionRate.toFixed(1),
      daysActive,
      createdDate: habit.created.split("T")[0],
    };
  });

  return stats;
}

// Mostrar estadísticas
function displayStatistics(data) {
  const stats = getStatistics(data);

  if (Object.keys(stats).length === 0) {
    console.log("No hay hábitos registrados aún");
    return;
  }

  console.log("\n=== ESTADÍSTICAS ===");
  Object.entries(stats).forEach(([habitName, stat]) => {
    console.log(`\n📊 ${habitName}`);
    console.log(`   Categoría: ${stat.category}`);
    console.log(`   Total de registros: ${stat.totalLogs}`);
    console.log(`   Completados: ${stat.completedLogs}`);
    console.log(`   Tasa de cumplimiento: ${stat.completionRate}%`);
    console.log(`   Días activos: ${stat.daysActive}`);
    console.log(`   Creado: ${stat.createdDate}`);
  });
}

// Listar hábitos
function listHabits(data) {
  if (data.habits.length === 0) {
    console.log("No hay hábitos registrados aún");
    return;
  }

  console.log("\n=== HÁBITOS REGISTRADOS ===");
  data.habits.forEach((habit, index) => {
    console.log(`${index + 1}. ${habit.name} (${habit.category})`);
  });
}

// Obtener recomendaciones con IA usando Claude
async function getAIRecommendations(data) {
  const stats = getStatistics(data);

  if (Object.keys(stats).length === 0) {
    console.log(
      "No hay hábitos registrados. Agrega algunos para obtener recomendaciones."
    );
    return;
  }

  const statsText = JSON.stringify(stats, null, 2);

  console.log("\n🤖 Obteniendo recomendaciones con IA...\n");

  const conversationHistory = [];

  // Primera mensaje: análisis de estadísticas
  conversationHistory.push({
    role: "user",
    content: `Analiza estas estadísticas de hábitos saludables y proporciona recomendaciones personalizadas:\n\n${statsText}\n