
// Access the email address of a user
import { getUserValue, loadHeaderFooter, myport } from "./utils.mjs";
import users from "./users.mjs";
loadHeaderFooter();
const port = myport();

const url = `http://localhost:${port}/input`;
let user = await getUserValue();
let userEmail = users[user];

let myRequestDate = new Date();
myRequestDate.setDate(myRequestDate.getDate());
myRequestDate = myRequestDate.toISOString().slice(0, 10);
const defaultCreateDate = document.getElementById("INPUT_DATE");
defaultCreateDate.value = myRequestDate;

let myDueDateDefault = new Date();
myDueDateDefault.setDate(myDueDateDefault.getDate() + 14);
myDueDateDefault = myDueDateDefault.toISOString().slice(0, 10);
const defaultDueDate = document.getElementById("DUE_DATE");
defaultDueDate.value = myDueDateDefault;

let reqBy = document.getElementById("reqby");
reqBy.value = user;

// Send a POST request
const form = document.querySelector("#entryform");
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const nextId = await fetch(url + "/nextId", { method: "GET" })
    .then((response) => response.json())
    .then((data) => {
      JSON.stringify(data);
      return data;
    });

  const dataJson = {
    INPUT_ID: nextId,
    CREATE_DATE: myRequestDate,
    CREATE_BY: user,
    CLOSED: "N",
  };
  for (let field of data.keys()) {
    // console.log(field);
    switch (field) {
      case "PEOPLE_ID":
        dataJson[field] = data.get(field).toUpperCase();
        break;
      case "ASSIGNED_TO":
        dataJson[field] = data.get(field).toUpperCase();
        break;
      case "SUBJECT":
        dataJson[field] = data.get(field).toUpperCase();
        break;
      case "PROJECT_ID":
        dataJson[field] = data.get(field).toUpperCase();
        break;
      default:
        if (field[field.length - 4] === "_DATE") {
          let myDate = data.get(field);
          myDate = myDate.slice(0, 10);
          dataJson[field] = myDate;
          // break;
        } else {
          dataJson[field] = data.get(field);
        }
    }
  }

  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataJson),
    });
    // console.log('Success:', JSON.stringify(dataJson));
  } catch (err) {
    console.log("Error:", err);
  }

setTimeout(async () => {
  // Try to send email
  let toEmail = users[dataJson.ASSIGNED_TO];
  if (toEmail === undefined) {
    toEmail = users["DEFAULT"];
  }
  const emailData = {
    INPUT_ID: nextId,
    CREATE_DATE: myRequestDate,
    CREATE_BY: user,
    SUBJECT: dataJson.SUBJECT.toUpperCase(),
    PEOPLE_ID: dataJson.PEOPLE_ID,
    ASSIGNED_TO_EMAIL: toEmail,
    INPUT_TEXT: dataJson.INPUT_TEXT,
    DUE_DATE: dataJson.DUE_DATE,
    ASSIGNED_TO: dataJson.ASSIGNED_TO,
  };
  await fetch(url + "/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(emailData),
  })
    .then(async (response) => {
      if (response.ok) {
        await fetch(url + "/inputs_notify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ACTION: "I",
            INPUT_ID: nextId,
            NOTIFY_DATE: myRequestDate,
            ASSIGNED_TO: dataJson.ASSIGNED_TO,
          }),
        });
        return response.text(); // Handle as plain text if not JSON
      }
      throw new Error("Failed to send email");
    });
});

  form.reset();
  document.getElementById("INPUT_DATE").value = myRequestDate;
  document.getElementById("DUE_DATE").value = myDueDateDefault;
});
