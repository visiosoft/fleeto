// Test script to verify letterhead save functionality
const testLetterhead = {
  name: "Test Letterhead",
  description: "Test description",
  customText: "This is custom text that should be saved",
  isDefault: false,
  header: {
    companyName: "Test Company",
    tagline: "Test Tagline"
  },
  footer: {
    text: "Test footer text",
    includePageNumbers: true,
    includeDate: true
  },
  styling: {
    primaryColor: "#1976d2",
    secondaryColor: "#666666",
    fontFamily: "Arial, sans-serif",
    fontSize: 12,
    logoSize: {
      width: 150,
      height: 60
    }
  },
  margins: {
    top: 1,
    bottom: 1,
    left: 1,
    right: 1
  },
  isActive: true
};

console.log("Test letterhead data:", JSON.stringify(testLetterhead, null, 2));
console.log("Custom text field:", testLetterhead.customText);
console.log("This data should be saved when you create a letterhead in the UI.");
