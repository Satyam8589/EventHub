// Check users and their roles
const checkUsers = async () => {
  try {
    console.log("🔍 Checking available users and their roles...");

    const response = await fetch("http://localhost:3000/api/admin/users");

    if (response.ok) {
      const data = await response.json();
      console.log("👥 Users found:", data.length);

      data.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email})`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Role: ${user.role}`);
        console.log("");
      });

      // Find admin users
      const adminUsers = data.filter(
        (user) => user.role === "SUPER_ADMIN" || user.role === "EVENT_ADMIN"
      );

      console.log("🔐 Admin users:");
      adminUsers.forEach((user) => {
        console.log(`- ${user.name}: ${user.role} (ID: ${user.id})`);
      });

      return adminUsers;
    } else {
      console.log("❌ Failed to fetch users:", response.status);
      return null;
    }
  } catch (error) {
    console.error("❌ Error checking users:", error);
    return null;
  }
};

checkUsers();
