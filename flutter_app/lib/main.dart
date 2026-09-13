import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

void main() {
  runApp(const AntigravityRemoteApp());
}

class AntigravityRemoteApp extends StatelessWidget {
  const AntigravityRemoteApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Antigravity Remote',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF090C15),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF6366F1),
          secondary: Color(0xFF06B6D4),
          surface: Color(0xFF121828),
        ),
      ),
      home: const MainNavigationScreen(),
    );
  }
}

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;
  WebSocketChannel? _channel;
  bool _isConnected = false;
  final List<Map<String, String>> _messages = [];
  final TextEditingController _promptController = TextEditingController();

  @override
  void initState() {
    super.initState();
    // Default connection to host server
  }

  void _connectToServer(String url, String token) {
    try {
      _channel = WebSocketChannel.connect(Uri.parse(url));
      _channel!.sink.add(jsonEncode({'type': 'auth', 'token': token}));
      
      _channel!.stream.listen((event) {
        final data = jsonDecode(event);
        if (data['type'] == 'auth_success') {
          setState(() {
            _isConnected = true;
          });
        } else if (data['type'] == 'agent_chunk') {
          setState(() {
            _messages.add({'role': 'agent', 'content': data['chunk']});
          });
        }
      }, onError: (err) {
        setState(() {
          _isConnected = false;
        });
      });
    } catch (e) {
      debugPrint('Connection error: $e');
    }
  }

  void _sendPrompt() {
    final text = _promptController.text.trim();
    if (text.isNotEmpty && _channel != null) {
      setState(() {
        _messages.add({'role': 'user', 'content': text});
      });
      _channel!.sink.add(jsonEncode({'type': 'prompt', 'prompt': text}));
      _promptController.clear();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF0D111C),
        elevation: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xFF6366F1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.rocket_launch, size: 18, color: Colors.white),
            ),
            const SizedBox(width: 10),
            const Text(
              'Antigravity Remote',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Row(
              children: [
                Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    color: _isConnected ? Colors.greenAccent : Colors.redAccent,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  _isConnected ? 'Connected' : 'Offline',
                  style: const TextStyle(fontSize: 12),
                ),
              ],
            ),
          )
        ],
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: [
          // Chat View
          Column(
            children: [
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _messages.length,
                  itemBuilder: (context, index) {
                    final msg = _messages[index];
                    final isUser = msg['role'] == 'user';
                    return Align(
                      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          color: isUser ? const Color(0xFF6366F1) : const Color(0xFF121828),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Text(msg['content'] ?? ''),
                      ),
                    );
                  },
                ),
              ),
              Container(
                padding: const EdgeInsets.all(12),
                color: const Color(0xFF0D111C),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _promptController,
                        decoration: const InputDecoration(
                          hintText: 'Type remote prompt...',
                          border: InputBorder.none,
                        ),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.send, color: Color(0xFF6366F1)),
                      onPressed: _sendPrompt,
                    ),
                  ],
                ),
              )
            ],
          ),
          // Tasks View
          const Center(child: Text('Tasks & Subagents Monitor')),
          // Files View
          const Center(child: Text('Workspace File Explorer')),
          // Settings View
          const Center(child: Text('Connection Settings')),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        backgroundColor: const Color(0xFF0D111C),
        selectedItemColor: const Color(0xFF6366F1),
        unselectedItemColor: Colors.grey,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.chat_bubble_outline), label: 'Chat'),
          BottomNavigationBarItem(icon: Icon(Icons.memory), label: 'Tasks'),
          BottomNavigationBarItem(icon: Icon(Icons.folder_open), label: 'Files'),
          BottomNavigationBarItem(icon: Icon(Icons.settings), label: 'Settings'),
        ],
      ),
    );
  }
}
