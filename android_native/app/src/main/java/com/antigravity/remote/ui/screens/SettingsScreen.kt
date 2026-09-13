package com.antigravity.remote.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun SettingsScreen() {
    var serverUrl by remember { mutableStateOf("ws://192.168.1.100:8080/ws") }
    var pairingPin by remember { mutableStateOf("") }
    var isInternetGateway by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF090C15))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFF121828)),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("📡 Server Connection Mode", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    FilterChip(
                        selected = !isInternetGateway,
                        onClick = {
                            isInternetGateway = false
                            serverUrl = "ws://192.168.1.100:8080/ws"
                        },
                        label = { Text("Local Wi-Fi") }
                    )
                    FilterChip(
                        selected = isInternetGateway,
                        onClick = {
                            isInternetGateway = true
                            serverUrl = "wss://your-tunnel.trycloudflare.com/ws"
                        },
                        label = { Text("Global Internet Tunnel") }
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))
                Text("Server Address (WebSocket URL)", color = Color.Gray, fontSize = 12.sp)

                OutlinedTextField(
                    value = serverUrl,
                    onValueChange = { serverUrl = it },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    )
                )

                Spacer(modifier = Modifier.height(12.dp))

                Button(
                    onClick = { /* Connect */ },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6366F1))
                ) {
                    Text("Save & Reconnect", color = Color.White)
                }
            }
        }

        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFF121828)),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("🔐 Security Pairing Code", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(4.dp))
                Text("Enter the 6-digit PIN displayed on your host terminal console.", color = Color.Gray, fontSize = 12.sp)

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = pairingPin,
                    onValueChange = { if (it.length <= 6) pairingPin = it },
                    placeholder = { Text("123456", color = Color.Gray) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    )
                )

                Spacer(modifier = Modifier.height(12.dp))

                Button(
                    onClick = { /* Pair */ },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF06B6D4))
                ) {
                    Text("Pair Device", color = Color.White)
                }
            }
        }
    }
}
