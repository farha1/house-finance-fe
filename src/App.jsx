import React, { useState, useEffect, useCallback } from "react";

// Load Lucide React for icons (ensure it's available in the environment)
// If not, you might need to use inline SVGs or other icon libraries.
// For this example, we'll assume it's available or use fallback if not.
// Example icons used: Plus, Edit, Trash2, LogIn, LogOut, User, DollarSign, CalendarDays
import {
  Plus,
  Edit,
  Trash2,
  LogIn,
  LogOut,
  User,
  DollarSign,
  CalendarDays,
  BarChart,
  ListTodo,
} from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000"; // Your FastAPI backend URL

// Utility function for API calls
const apiCall = async (endpoint, method = "GET", data = null, token = null) => {
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };
  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const responseData = await response.json();

    if (!response.ok) {
      // Handle HTTP errors (4xx, 5xx)
      const errorMessage =
        responseData.message || responseData.detail || "An error occurred";
      throw new Error(errorMessage);
    }
    return responseData;
  } catch (error) {
    console.error("API Call Error:", error);
    throw error;
  }
};

// Main App Component
const App = () => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState("budgets"); // 'budgets', 'realizations', 'login', 'register'
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success' or 'error'

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 5000); // Message disappears after 5 seconds
  };

  const fetchCurrentUser = useCallback(async () => {
    if (!token) {
      setCurrentUser(null);
      return;
    }
    try {
      const user = await apiCall("/users/me/", "GET", null, token);
      setCurrentUser(user);
    } catch (error) {
      console.error("Failed to fetch current user:", error);
      setToken(null);
      localStorage.removeItem("token");
      setCurrentUser(null);
      showMessage("Session expired or invalid. Please log in again.", "error");
      setCurrentPage("login");
    }
  }, [token]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!token) {
        setCurrentUser(null);
        setCurrentPage("login");
        return;
      }
      try {
        const user = await apiCall("/users/me/", "GET", null, token);
        setCurrentUser(user);
      } catch (error) {
        console.error("Failed to fetch current user:", error);
        setToken(null);
        localStorage.removeItem("token");
        setCurrentUser(null);
        showMessage(
          "Session expired or invalid. Please log in again.",
          "error"
        );
        setCurrentPage("login");
      }
    };
    fetchCurrentUser();
  }, [token]);

  const handleLogin = async (username, password) => {
    try {
      // OAuth2PasswordRequestForm expects x-www-form-urlencoded
      const response = await fetch(`${API_BASE_URL}/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ username, password }).toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.detail || "Login failed";
        showMessage(errorMessage, "error");
        return;
      }

      setToken(data.access_token);
      localStorage.setItem("token", data.access_token);
      showMessage("Login successful!", "success");
      fetchCurrentUser();
      setCurrentPage("budgets"); // Redirect to budgets page after login
    } catch (error) {
      console.error("Login error:", error);
      showMessage("Network error during login. Please try again.", "error");
    }
  };

  const handleRegister = async (username, password) => {
    try {
      await apiCall("/register/", "POST", { username, password });
      showMessage("Registration successful! Please log in.", "success");
      setCurrentPage("login");
    } catch (error) {
      showMessage(error.message || "Registration failed", "error");
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("token");
    setCurrentUser(null);
    showMessage("Logged out successfully.", "success");
    setCurrentPage("login");
  };

  // Conditional rendering based on authentication and current page
  if (!token || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-inter">
        {message && (
          <div
            className={`absolute top-4 right-4 p-3 rounded-lg shadow-md ${
              messageType === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {message}
          </div>
        )}
        {currentPage === "login" && (
          <LoginForm
            onLogin={handleLogin}
            onSwitchToRegister={() => setCurrentPage("register")}
          />
        )}
        {currentPage === "register" && (
          <RegisterForm
            onRegister={handleRegister}
            onSwitchToLogin={() => setCurrentPage("login")}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-inter">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-4 shadow-lg flex justify-between items-center rounded-b-lg">
        <h1 className="text-3xl font-bold flex items-center">House Finance</h1>
        <nav className="flex items-center space-x-4">
          <span className="text-lg font-medium flex items-center">
            <User size={20} className="mr-1" /> {currentUser.username}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
          >
            <LogOut size={18} className="mr-2" /> Logout
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6">
        {message && (
          <div
            className={`mb-4 p-3 rounded-lg shadow-md ${
              messageType === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {message}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-6 space-x-4">
          <button
            onClick={() => setCurrentPage("budgets")}
            className={`flex items-center px-6 py-3 rounded-xl shadow-md transition duration-300 ease-in-out ${
              currentPage === "budgets"
                ? "bg-blue-500 text-white transform scale-105"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            <BarChart size={20} className="mr-2" /> Budgets
          </button>
          <button
            onClick={() => setCurrentPage("realizations")}
            className={`flex items-center px-6 py-3 rounded-xl shadow-md transition duration-300 ease-in-out ${
              currentPage === "realizations"
                ? "bg-blue-500 text-white transform scale-105"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            <ListTodo size={20} className="mr-2" /> Realizations
          </button>
        </div>

        {/* Render current page component */}
        {currentPage === "budgets" && (
          <BudgetSection token={token} showMessage={showMessage} />
        )}
        {currentPage === "realizations" && (
          <RealizationSection token={token} showMessage={showMessage} />
        )}
      </main>
    </div>
  );
};

// --- Authentication Forms ---

const AuthCard = ({ title, children }) => (
  <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-200">
    <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
      {title}
    </h2>
    {children}
  </div>
);

const AuthInput = ({ label, type, value, onChange, placeholder }) => (
  <div className="mb-4">
    <label className="block text-gray-700 text-sm font-semibold mb-2">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-2 text-black rounded-lg"
      required
    />
  </div>
);

const AuthButton = ({ children, onClick, className = "" }) => (
  <button
    onClick={onClick}
    className={`w-full py-3 px-4 rounded-lg text-white font-semibold shadow-md transition duration-300 ease-in-out transform hover:scale-105 ${className}`}
  >
    {children}
  </button>
);

const LoginForm = ({ onLogin, onSwitchToRegister }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <AuthCard title="Login">
      <form onSubmit={handleSubmit}>
        <AuthInput
          label="Username"
          type="text"
          value={username}
          onChange={setUsername}
          placeholder="Enter your username"
        />
        <AuthInput
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="Enter your password"
        />
        <AuthButton
          onClick={handleSubmit}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <LogIn size={20} className="inline-block mr-2" /> Login
        </AuthButton>
      </form>
      <p className="text-center text-gray-600 mt-6">
        Don't have an account?{" "}
        <button
          onClick={onSwitchToRegister}
          className="text-blue-600 hover:underline font-semibold"
        >
          Register here
        </button>
      </p>
    </AuthCard>
  );
};

const RegisterForm = ({ onRegister, onSwitchToLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onRegister(username, password);
  };

  return (
    <AuthCard title="Register">
      <form onSubmit={handleSubmit}>
        <AuthInput
          label="Username"
          type="text"
          value={username}
          onChange={setUsername}
          placeholder="Choose a username"
        />
        <AuthInput
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="Choose a password (min 6 chars)"
        />
        <AuthButton
          onClick={handleSubmit}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <User size={20} className="inline-block mr-2" /> Register
        </AuthButton>
      </form>
      <p className="text-center text-gray-600 mt-6">
        Already have an account?{" "}
        <button
          onClick={onSwitchToLogin}
          className="text-purple-600 hover:underline font-semibold"
        >
          Login here
        </button>
      </p>
    </AuthCard>
  );
};

// --- Budget Section ---

const BudgetSection = ({ token, showMessage }) => {
  const [budgets, setBudgets] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null); // null for new, object for edit
  const [loading, setLoading] = useState(false);

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiCall("/budgets/", "GET", null, token);
      setBudgets(data);
    } catch (error) {
      showMessage(error.message || "Failed to fetch budgets.", "error");
    } finally {
      setLoading(false);
    }
  }, [token, showMessage]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleSaveBudget = async (budgetData) => {
    setLoading(true);
    try {
      if (editingBudget) {
        await apiCall(`/budgets/${editingBudget.id}`, "PUT", budgetData, token);
        showMessage("Budget updated successfully!", "success");
      } else {
        await apiCall("/budgets/", "POST", budgetData, token);
        showMessage("Budget created successfully!", "success");
      }
      setIsFormOpen(false);
      setEditingBudget(null);
      fetchBudgets();
    } catch (error) {
      showMessage(error.message || "Failed to save budget.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBudget = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this budget? All associated realizations will also be deleted."
      )
    ) {
      return;
    }
    setLoading(true);
    try {
      await apiCall(`/budgets/${id}`, "DELETE", null, token);
      showMessage("Budget deleted successfully!", "success");
      fetchBudgets();
    } catch (error) {
      showMessage(error.message || "Failed to delete budget.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (budget) => {
    setEditingBudget(budget);
    setIsFormOpen(true);
  };

  const handleAddClick = () => {
    setEditingBudget(null);
    setIsFormOpen(true);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
        <BarChart size={24} className="mr-2" /> Your Budgets
      </h2>

      <button
        onClick={handleAddClick}
        className="mb-6 flex items-center px-5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
      >
        <Plus size={20} className="mr-2" /> Add New Budget
      </button>

      {isFormOpen && (
        <BudgetForm
          onSave={handleSaveBudget}
          onCancel={() => setIsFormOpen(false)}
          initialData={editingBudget}
          loading={loading}
        />
      )}

      {loading && !isFormOpen && (
        <p className="text-blue-600 text-center py-4">Loading budgets...</p>
      )}

      {!loading && budgets.length === 0 && !isFormOpen && (
        <p className="text-gray-600 text-center py-4">
          No budgets found. Add one to get started!
        </p>
      )}

      {!isFormOpen && budgets.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-md">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Limit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Realized
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Month/Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {budgets.map((budget) => (
                <tr key={budget.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {budget.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {budget.limit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {budget.total_realized}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {budget.budget_month}/{budget.budget_year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditClick(budget)}
                        className="text-blue-600 hover:text-blue-900 transition duration-150 ease-in-out"
                        title="Edit Budget"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteBudget(budget.id)}
                        className="text-red-600 hover:text-red-900 transition duration-150 ease-in-out"
                        title="Delete Budget"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const BudgetForm = ({ onSave, onCancel, initialData, loading }) => {
  const [name, setName] = useState(initialData?.name || "");
  const [limit, setLimit] = useState(initialData?.limit || "");
  const [budgetMonth, setBudgetMonth] = useState(
    initialData?.budget_month || new Date().getMonth() + 1
  );
  const [budgetYear, setBudgetYear] = useState(
    initialData?.budget_year || new Date().getFullYear()
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      name,
      limit: parseFloat(limit),
      budget_month: parseInt(budgetMonth),
      budget_year: parseInt(budgetYear),
    });
  };

  return (
    <div className="bg-gray-50 p-6 rounded-xl shadow-inner mb-6 border border-gray-200">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        {initialData ? "Edit Budget" : "Add New Budget"}
      </h3>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-2">
            Budget Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border text-black border-gray-300 rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-2">
            Limit Amount
          </label>
          <input
            type="number"
            step="0.01"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            className="w-full px-4 py-2 border text-black border-gray-300 rounded-lg"
            required
          />
        </div>
        {!initialData && (
          <>
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Month
              </label>
              <input
                type="number"
                value={budgetMonth}
                onChange={(e) => setBudgetMonth(e.target.value)}
                min="1"
                max="12"
                className="w-full px-4 py-2 border text-black border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Year
              </label>
              <input
                type="number"
                value={budgetYear}
                onChange={(e) => setBudgetYear(e.target.value)}
                min="2000"
                className="w-full px-4 py-2 border text-black border-gray-300 rounded-lg"
                required
              />
            </div>
          </>
        )}
        <div className="col-span-1 md:col-span-2 flex justify-end space-x-3 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg shadow-md transition duration-300 ease-in-out"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading
              ? "Saving..."
              : initialData
              ? "Update Budget"
              : "Add Budget"}
          </button>
        </div>
      </form>
    </div>
  );
};

// --- Realization Section ---

const RealizationSection = ({ token, showMessage }) => {
  const [realizations, setRealizations] = useState([]);
  const [budgets, setBudgets] = useState([]); // To populate budget_id dropdown
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRealization, setEditingRealization] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");

  const fetchBudgetsForDropdown = useCallback(async () => {
    try {
      const data = await apiCall("/budgets/", "GET", null, token);
      setBudgets(data);
    } catch (error) {
      showMessage(
        error.message || "Failed to load budgets for dropdown.",
        "error"
      );
    }
  }, [token, showMessage]);

  const fetchRealizations = useCallback(async () => {
    setLoading(true);
    try {
      let endpoint = "/realizations/";
      const params = new URLSearchParams();
      if (filterMonth) {
        params.append("month", filterMonth);
      }
      if (filterYear) {
        params.append("year", filterYear);
      }
      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }
      const data = await apiCall(endpoint, "GET", null, token);
      setRealizations(data);
    } catch (error) {
      showMessage(error.message || "Failed to fetch realizations.", "error");
    } finally {
      setLoading(false);
    }
  }, [token, showMessage, filterMonth, filterYear]);

  useEffect(() => {
    fetchBudgetsForDropdown();
  }, [fetchBudgetsForDropdown]);

  useEffect(() => {
    fetchRealizations();
  }, [fetchRealizations]);

  const handleSaveRealization = async (realizationData) => {
    setLoading(true);
    try {
      if (editingRealization) {
        await apiCall(
          `/realizations/${editingRealization.id}`,
          "PUT",
          realizationData,
          token
        );
        showMessage("Realization updated successfully!", "success");
      } else {
        await apiCall("/realizations/", "POST", realizationData, token);
        showMessage("Realization created successfully!", "success");
      }
      setIsFormOpen(false);
      setEditingRealization(null);
      fetchRealizations();
    } catch (error) {
      showMessage(error.message || "Failed to save realization.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRealization = async (id) => {
    if (!window.confirm("Are you sure you want to delete this realization?")) {
      return;
    }
    setLoading(true);
    try {
      await apiCall(`/realizations/${id}`, "DELETE", null, token);
      showMessage("Realization deleted successfully!", "success");
      fetchRealizations();
    } catch (error) {
      showMessage(error.message || "Failed to delete realization.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (realization) => {
    setEditingRealization(realization);
    setIsFormOpen(true);
  };

  const handleAddClick = () => {
    setEditingRealization(null);
    setIsFormOpen(true);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
        <ListTodo size={24} className="mr-2" /> Your Realizations
      </h2>

      <button
        onClick={handleAddClick}
        className="mb-6 flex items-center px-5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
      >
        <Plus size={20} className="mr-2" /> Add New Realization
      </button>

      {isFormOpen && (
        <RealizationForm
          onSave={handleSaveRealization}
          onCancel={() => setIsFormOpen(false)}
          initialData={editingRealization}
          budgets={budgets} // Pass budgets for dropdown
          loading={loading}
        />
      )}

      <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow-inner flex items-center space-x-4">
        <h3 className="text-lg font-semibold text-gray-700">
          Filter Realizations:
        </h3>
        <div className="flex items-center space-x-2">
          <label htmlFor="filterMonth" className="text-sm text-gray-600">
            Month:
          </label>
          <input
            type="number"
            id="filterMonth"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            min="1"
            max="12"
            placeholder="e.g., 7"
            className="w-24 px-3 py-1 text-black border border-gray-300 rounded-lg"
          />
        </div>
        <div className="flex items-center space-x-2">
          <label htmlFor="filterYear" className="text-sm text-gray-600">
            Year:
          </label>
          <input
            type="number"
            id="filterYear"
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            min="2000"
            placeholder="e.g., 2025"
            className="w-28 px-3 py-1 text-black border border-gray-300 rounded-lg"
          />
        </div>
        <button
          onClick={fetchRealizations}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md transition duration-300 ease-in-out"
        >
          Apply Filter
        </button>
        <button
          onClick={() => {
            setFilterMonth("");
            setFilterYear("");
          }}
          className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg shadow-md transition duration-300 ease-in-out"
        >
          Clear Filters
        </button>
      </div>

      {loading && !isFormOpen && (
        <p className="text-blue-600 text-center py-4">
          Loading realizations...
        </p>
      )}

      {!isFormOpen && realizations.length === 0 && !loading && (
        <p className="text-gray-600 text-center py-4">
          No realizations found for the selected filters. Add one to get
          started!
        </p>
      )}

      {!isFormOpen && realizations.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-md">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Budget
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {realizations.map((realization) => (
                <tr key={realization.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {realization.expense_date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {realization.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {budgets.find((b) => b.id === realization.budget_id)
                      ?.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {realization.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditClick(realization)}
                        className="text-blue-600 hover:text-blue-900 transition duration-150 ease-in-out"
                        title="Edit Realization"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteRealization(realization.id)}
                        className="text-red-600 hover:text-red-900 transition duration-150 ease-in-out"
                        title="Delete Realization"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const RealizationForm = ({
  onSave,
  onCancel,
  initialData,
  budgets,
  loading,
}) => {
  const [expenseDate, setExpenseDate] = useState(
    initialData?.expense_date || ""
  );
  const [name, setName] = useState(initialData?.name || "");
  const [budgetId, setBudgetId] = useState(initialData?.budget_id || "");
  const [amount, setAmount] = useState(initialData?.amount || "");

  useEffect(() => {
    if (initialData) {
      setExpenseDate(initialData.expense_date);
      setName(initialData.name);
      setBudgetId(initialData.budget_id);
      setAmount(initialData.amount);
    } else {
      // Set default date to today for new realizations
      setExpenseDate(new Date().toISOString().split("T")[0]);
      setName("");
      setBudgetId("");
      setAmount("");
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!budgetId) {
      alert("Please select a budget."); // Using alert for simple client-side validation
      return;
    }
    onSave({
      expense_date: expenseDate,
      name,
      budget_id: budgetId,
      amount: parseFloat(amount),
    });
  };

  return (
    <div className="bg-gray-50 p-6 rounded-xl shadow-inner mb-6 border border-gray-200">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        {initialData ? "Edit Realization" : "Add New Realization"}
      </h3>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-2">
            Date
          </label>
          <input
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-2">
            Description
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg"
            required
          />
        </div>
        {!initialData && (
          <>
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Budget
              </label>
              <select
                value={budgetId}
                onChange={(e) => setBudgetId(e.target.value)}
                className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg"
                required
              >
                <option value="">Select a Budget</option>
                {budgets.map((budget) => (
                  <option key={budget.id} value={budget.id}>
                    {budget.name} ({budget.budget_month}/{budget.budget_year})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg"
                required
              />
            </div>
          </>
        )}
        <div className="col-span-1 md:col-span-2 flex justify-end space-x-3 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg shadow-md transition duration-300 ease-in-out"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading
              ? "Saving..."
              : initialData
              ? "Update Realization"
              : "Add Realization"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default App;
