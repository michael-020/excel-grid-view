export interface RecordRow {
  id: number;
  firstName: string;
  lastName: string;
  age: number;
  salary: number;
}

export function generateSampleRecords(count: number): RecordRow[] {
  const firstNames = ["Raj", "Asha", "Mira", "Vikram", "Kiran", "Priya", "Aman", "Neha", "Rohan", "Sunita"];
  const lastNames = ["Solanki", "Patel", "Shah", "Rai", "Chaudhary", "Singh", "Kumar", "Mehta", "Nair", "Joshi"];

  return Array.from({ length: count }, (_, index) => {
    const firstName = firstNames[index % firstNames.length];
    const lastName = lastNames[(index + 3) % lastNames.length];
    const age = 20 + ((index * 7) % 45);
    const salary = 30000 + ((index * 1337) % 1800000);
    return {
      id: index + 1,
      firstName,
      lastName,
      age,
      salary,
    };
  });
}
