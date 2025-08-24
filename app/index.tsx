import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  Platform,
  Pressable,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Checkbox from "expo-checkbox";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Swipeable } from "react-native-gesture-handler";

type Task = { 
  id: string; 
  text: string; 
  completed: boolean; 
  dueDate?: string; 
  category?: string;
};

export default function HomeScreen() {
  const [task, setTask] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<"All" | "Active" | "Completed">("All");

  // Due date & category
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [category, setCategory] = useState("");

  // Load tasks from storage
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const saved = await AsyncStorage.getItem("tasks");
        if (saved) setTasks(JSON.parse(saved));
      } catch (err) {
        console.error("Load error:", err);
      }
    };
    loadTasks();
  }, []);

  // Save tasks
  useEffect(() => {
    AsyncStorage.setItem("tasks", JSON.stringify(tasks)).catch(console.error);
  }, [tasks]);

  const addTask = () => {
    if (task.trim().length === 0) return;
    setTasks([
      ...tasks,
      {
        id: Date.now().toString(),
        text: task,
        completed: false,
        dueDate: dueDate ? dueDate.toDateString() : undefined,
        category: category || "General",
      },
    ]);
    setTask("");
    setDueDate(null);
    setCategory("");
  };

  const toggleTask = (id: string) =>
    setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));

  const deleteTask = (id: string) =>
    setTasks(tasks.filter((t) => t.id !== id));

  // Filtered tasks
  const filteredTasks = tasks.filter((t) => {
    if (filter === "Active") return !t.completed;
    if (filter === "Completed") return t.completed;
    return true;
  });

  // Render swipe-to-delete row
  const renderTask = ({ item }: { item: Task }) => (
    <Swipeable
      renderRightActions={() => (
        <Pressable style={styles.deleteButton} onPress={() => deleteTask(item.id)}>
          <Text style={{ color: "white", fontWeight: "bold" }}>Delete</Text>
        </Pressable>
      )}
    >
      <View style={styles.taskRow}>
        <Checkbox
          value={item.completed}
          onValueChange={() => toggleTask(item.id)}
          color={item.completed ? "#4CAF50" : undefined}
        />
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={[styles.task, item.completed && styles.completedTask]}>
            {item.text}
          </Text>
          {item.dueDate && (
            <Text style={styles.dueDate}>Due: {item.dueDate}</Text>
          )}
          {item.category && (
            <Text style={styles.category}>Category: {item.category}</Text>
          )}
        </View>
      </View>
    </Swipeable>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📝 My To-Do List</Text>

      {/* Input */}
      <TextInput
        style={styles.input}
        placeholder="Enter task..."
        value={task}
        onChangeText={setTask}
      />

      {/* Category */}
      <TextInput
        style={styles.input}
        placeholder="Category (e.g. Work, Home)"
        value={category}
        onChangeText={setCategory}
      />

      {/* Due Date */}
      <View style={{ marginBottom: 10 }}>
        <Button
          title={dueDate ? `Due: ${dueDate.toDateString()}` : "Pick Due Date"}
          onPress={() => setShowDatePicker(true)}
        />
      </View>
      {showDatePicker && (
        <DateTimePicker
          value={dueDate || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setDueDate(selectedDate);
          }}
        />
      )}

      {/* Add Task Button */}
      <Button title="Add Task" onPress={addTask} />

      {/* Filters */}
      <View style={styles.filterRow}>
        {["All", "Active", "Completed"].map((f) => (
          <Button
            key={f}
            title={f}
            onPress={() => setFilter(f as any)}
            color={filter === f ? "#4CAF50" : "gray"}
          />
        ))}
      </View>

      {/* Task List */}
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#aaa",
    marginBottom: 10,
    padding: 5,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
    padding: 10,
    backgroundColor: "#f1f1f1",
    borderRadius: 5,
  },
  task: {
    fontSize: 18,
  },
  completedTask: {
    textDecorationLine: "line-through",
    color: "gray",
  },
  dueDate: {
    fontSize: 12,
    color: "red",
  },
  category: {
    fontSize: 12,
    color: "blue",
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 15,
  },
  deleteButton: {
    backgroundColor: "red",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    borderRadius: 5,
  },
});
