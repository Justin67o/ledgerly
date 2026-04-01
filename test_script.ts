import test from "node:test";
import { prisma } from "./lib/prisma";

// testAccounts.ts (temporary)

async function testGetAccounts() {
  const res = await fetch('http://127.0.0.1:3000/api/accounts/cmn3b9bvt0004rwvsc166malx');
  const data = await res.json();
  console.log('GET /accounts:', data);
}


async function testPostAccount() {
  const res = await fetch('http://localhost:3000/api/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: "Test Checking",
      type: "CHECKING",
      balance: 1000,
      userId: "abcdefg" // replace with an actual User id from DB
    })
  });
  const data = await res.json();
  console.log('POST /accounts:', data);
}

async function testPutAccount(){
  const res = await fetch('http://localhost:3000/api/accounts/cmn3b9bvt0004rwvsc166malx', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: "Updated Test Checking",
      balance: 1500
    })
  });
}

async function testDeleteAccount(){
  const res = await fetch('http://localhost:3000/api/accounts/cmn3b9bvt0004rwvsc166malx', {
    method: 'DELETE'
  });
}
//testPostAccount();


// testGetAccounts();

// testPutAccount();

// testDeleteAccount();


import bcrypt from "bcrypt";

async function testUser() {
  const hashedPassword = await bcrypt.hash("password123", 10);

  await prisma.user.create({
    data: {
      email: "test@example.com",
      name: "Test User",
      password: hashedPassword,
    },
  });

  console.log("Test user created with hashed password");
}

testUser();


async function testAuth(){
  const res = await fetch("http://localhost:3000/api/accounts");
  const data = await res.json();
  console.log(data);
}

async function testAccountCreation(){
  const res = await fetch("http://localhost:3000/api/accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test Checking",
      type: "CHECKING",
      balance: 1000,
      userId: "cmn6dzbbt0000v4vs8rktnp0i"
    })
  });
  const data = await res.json();
  console.log("POST /accounts:", data);
}
