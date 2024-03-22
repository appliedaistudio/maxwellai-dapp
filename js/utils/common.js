import { log } from "./logging.js";
import config from "../dapp-config.js";

// Function to get the local date and time synchronously
function getLocalDateTime() {
    const functionName = "getLocalDateTime";
    log("Entering function", config.verbosityLevel, 4, functionName);

    try {
      // Create a new Date object representing the current date and time
      const currentDate = new Date();
      // Return the current date
      return currentDate;
    } catch (error) {
      // If an error occurs during date creation, log the error
      log(error, config.verbosityLevel, 3, functionName);
    }
  }

const commonTools = [
    {
        name: "Get The Current Local Date and Time",
        func: getLocalDateTime,
        description: `Get the current local date and time. This function does not take an input parameter`
    }
];

export {getLocalDateTime, commonTools}