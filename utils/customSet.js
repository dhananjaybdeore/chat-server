// class CustomSet extends Set {
//   add(value) {
//     super.add(value); // Adds the value to the set
//     this.logMembers("Added");
//     return this; // Return the set for chaining if desired
//   }

//   delete(value) {
//     super.delete(value); // Removes the value from the set
//     this.logMembers("Removed");
//     return this; // Return the set for chaining if desired
//   }

//   // Method to log all the members of the set
//   logMembers(action) {
//     console.log(`${action} value. Current members of the set:`);

//     // Log only the 'name' property of each item
//     const members = [...this].map((item) => this.getNameProperty(item));
//     console.log(members.join(", "));
//   }

//   // Function to extract and log only the 'name' property
//   getNameProperty(item) {
//     if (typeof item === "object" && item !== null) {
//       return item.name || "N/A"; // If the 'name' exists, return it; otherwise, return 'N/A'
//     }
//     return item; // If it's not an object, just return the value
//   }
// }

// module.exports = CustomSet;
