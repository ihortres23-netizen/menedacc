import { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
const API = `${BACKEND_URL}/api`;

function App() {
  const [resources, setResources] = useState([]);
  const [formData, setFormData] = useState({ url: "", login: "", password: "" });
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(null);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const response = await axios.get(`${API}/resources`);
      setResources(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Ошибка загрузки ресурсов:", error);
      setResources([]);
    }
  };

  const handleAddResource = async (e) => {
    e.preventDefault();
    if (!formData.url || !formData.login || !formData.password) {
      alert("Заполните все поля!");
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API}/resources`, formData);
      setFormData({ url: "", login: "", password: "" });
      await fetchResources();
      alert("Ресурс добавлен!");
    } catch (error) {
      console.error("Ошибка добавления:", error);
      alert("Ошибка при добавлении ресурса");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      alert("Выберите файл!");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await axios.post(`${API}/resources/import`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await fetchResources();
      setSelectedFile(null);
      document.getElementById("fileInput").value = "";
      
      let message = response.data.message;
      if (response.data.errors && response.data.errors.length > 0) {
        message += "\n\nОшибки:\n" + response.data.errors.join("\n");
      }
      alert(message);
    } catch (error) {
      console.error("Ошибка загрузки файла:", error);
      alert("Ошибка при загрузке файла");
    } finally {
      setLoading(false);
    }
  };

  const toggleResource = async (id, currentStatus) => {
    try {
      await axios.put(`${API}/resources/${id}`, {
        is_active: !currentStatus,
      });
      await fetchResources();
    } catch (error) {
      console.error("Ошибка переключения:", error);
      alert("Ошибка при переключении статуса");
    }
  };

  const deleteResource = async (id) => {
    if (!window.confirm("Удалить ресурс?")) return;

    try {
      await axios.delete(`${API}/resources/${id}`);
      await fetchResources();
    } catch (error) {
      console.error("Ошибка удаления:", error);
      alert("Ошибка при удалении ресурса");
    }
  };

  const connectToResource = (resource) => {
    window.open(resource.url, "_blank");
    setShowCredentials(resource);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Менеджер Ресурсов
          </h1>
          <p className="text-gray-600">Управляйте доступом к вашим ресурсам</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Добавить ресурс
          </h2>
          <form onSubmit={handleAddResource} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="URL (например: https://example.com)"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Логин"
                value={formData.login}
                onChange={(e) =>
                  setFormData({ ...formData, login: e.target.value })
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="password"
                placeholder="Пароль"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {loading ? "Добавление..." : "Добавить ресурс"}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Загрузить из файла
          </h2>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <input
                id="fileInput"
                type="file"
                accept=".txt,.csv"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-xs text-gray-500 mt-2">
                Формат файла: url:login:pass (каждая строка - новый ресурс)
              </p>
            </div>
            <button
              onClick={handleFileUpload}
              disabled={loading || !selectedFile}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
            >
              Загрузить
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Ваши ресурсы ({resources.length})
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Подсказка: Кликните на любую активную строку для быстрого подключения
          </p>
          {resources.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Нет добавленных ресурсов
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      URL
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Логин
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Статус
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {resources.map((resource) => (
                    <tr
                      key={resource.id}
                      onClick={() => resource.is_active && connectToResource(resource)}
                      className={`hover:bg-gray-50 ${resource.is_active ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                    >
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {resource.url}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {resource.login}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            resource.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {resource.is_active ? "Подключен" : "Отключен"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleResource(resource.id, resource.is_active);
                            }}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                              resource.is_active
                                ? "bg-yellow-500 text-white hover:bg-yellow-600"
                                : "bg-green-500 text-white hover:bg-green-600"
                            }`}
                          >
                            {resource.is_active ? "Отключить" : "Включить"}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              connectToResource(resource);
                            }}
                            disabled={!resource.is_active}
                            className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                          >
                            Подключить
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteResource(resource.id);
                            }}
                            className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition"
                          >
                            Удалить
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
      </div>

      {showCredentials && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowCredentials(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4 text-gray-800">
              Данные для входа
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  URL:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={showCredentials.url}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(showCredentials.url);
                      alert("URL скопирован!");
                    }}
                    className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Копировать
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Логин:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={showCredentials.login}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(showCredentials.login);
                      alert("Логин скопирован!");
                    }}
                    className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Копировать
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Пароль:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={showCredentials.password}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(showCredentials.password);
                      alert("Пароль скопирован!");
                    }}
                    className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Копировать
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowCredentials(null)}
              className="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
