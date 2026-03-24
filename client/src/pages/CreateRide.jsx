import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@context/AuthContext";
import {
  isValidDescriptiveText,
  isValidLicenseNumber,
  isValidName,
  isValidPhone,
  isValidPlace,
  isValidVehicleNumber,
} from "@utils/validators";

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const convert12HourTo24Hour = (hour, minute, meridiem) => {
  if (!hour || !minute || !meridiem) return "";

  const parsedHour = Number(hour);
  if (Number.isNaN(parsedHour)) return "";

  let nextHour = parsedHour % 12;
  if (meridiem === "PM") nextHour += 12;

  return `${String(nextHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

const convert24HourTo12Hour = (time) => {
  if (!time) {
    return { hour: "", minute: "", meridiem: "AM" };
  }

  const [hoursText, minutesText] = time.split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return { hour: "", minute: "", meridiem: "AM" };
  }

  return {
    hour: String(hours % 12 || 12),
    minute: String(minutes).padStart(2, "0"),
    meridiem: hours >= 12 ? "PM" : "AM",
  };
};

const CreateRide = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    from: "",
    to: "",
    departureDate: "",
    departureTime: "",
    carModel: "",
    totalSeats: 4,
    pricePerSeat: 250,
    notes: "",
    drivingLicenseNumber: "",
    vehicleRegistrationNumber: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [timeParts, setTimeParts] = useState({
    hour: "",
    minute: "",
    meridiem: "AM",
  });
  const minDepartureDate = getTodayDateString();

  useEffect(() => {
    if (!user) return;

    setFormData((prev) => ({
      ...prev,
      drivingLicenseNumber: prev.drivingLicenseNumber || user.drivingLicenseNumber || "",
      vehicleRegistrationNumber: prev.vehicleRegistrationNumber || user.vehicleRegistrationNumber || "",
      emergencyContactName: prev.emergencyContactName || user.emergencyContactName || "",
      emergencyContactPhone: prev.emergencyContactPhone || user.emergencyContactPhone || "",
    }));
  }, [user]);

  const validateField = (name, value, allValues = formData) => {
    const from = allValues.from?.trim() || "";
    const to = allValues.to?.trim() || "";
    const date = allValues.departureDate;
    const time = allValues.departureTime;
    switch (name) {
      case "from":
        if (!from) return "Source is required";
        if (to && from.toLowerCase() === to.toLowerCase()) return "Source and destination must be different";
        if (!isValidPlace(from)) return "Enter a valid source";
        return "";
      case "to":
        if (!to) return "Destination is required";
        if (from && from.toLowerCase() === to.toLowerCase()) return "Source and destination must be different";
        if (!isValidPlace(to)) return "Enter a valid destination";
        return "";
      case "departureDate":
      case "departureTime": {
        if (!date || !time) return "Departure date and time are required";
        if (date < minDepartureDate) return "Invalid date";
        const dt = new Date(`${date}T${time}`);
        if (Number.isNaN(dt.getTime())) return "Invalid date or time";
        const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
        if (dt < oneHourFromNow) return "Ride must be scheduled at least 1 hour in advance";
        return "";
      }
      case "totalSeats":
        if (Number.isNaN(Number(value)) || Number(value) < 1) return "Seats must be at least 1";
        return "";
      case "pricePerSeat":
        if (Number.isNaN(Number(value)) || Number(value) < 0) return "Fare must be 0 or greater";
        return "";
      case "drivingLicenseNumber":
        if (!String(value || "").trim()) return "Licence number is required";
        if (!isValidLicenseNumber(value)) return "Enter a valid licence number";
        return "";
      case "vehicleRegistrationNumber":
        if (!String(value || "").trim()) return "Vehicle number is required";
        if (!isValidVehicleNumber(value)) return "Enter a valid vehicle number";
        return "";
      case "emergencyContactName":
        if (!String(value || "").trim()) return "Emergency contact name is required";
        if (!isValidName(value)) return "Enter a valid contact name";
        return "";
      case "emergencyContactPhone":
        if (!isValidPhone(value)) {
          return "Enter a valid emergency contact";
        }
        return "";
      case "carModel":
        if (String(value || "").trim() && !isValidPlace(value)) return "Enter a valid car model";
        return "";
      case "notes":
        if (String(value || "").trim() && !isValidDescriptiveText(value)) return "Add meaningful notes";
        return "";
      default:
        return "";
    }
  };

  const validateAll = (values) => {
    const errors = {};
    [
      "from",
      "to",
      "departureDate",
      "departureTime",
      "totalSeats",
      "pricePerSeat",
      "drivingLicenseNumber",
      "vehicleRegistrationNumber",
      "emergencyContactName",
      "emergencyContactPhone",
      "carModel",
      "notes",
    ].forEach((field) => {
      const message = validateField(field, values[field], values);
      if (message) errors[field] = message;
    });
    return errors;
  };

  const mapApiErrorsToFields = (apiErrors) => {
    const nextErrors = {};
    apiErrors.forEach((item) => {
      const field = item.field;
      const message = item.message;
      if (!message) return;

      if (field && field !== "body") {
        nextErrors[field] = message;
        return;
      }

      if (message.toLowerCase().includes("source")) {
        nextErrors.from = message;
      }
      if (message.toLowerCase().includes("destination")) {
        nextErrors.to = message;
      }
      if (message.toLowerCase().includes("date") || message.toLowerCase().includes("time")) {
        nextErrors.departureDate = message;
        nextErrors.departureTime = message;
      }
      if (message.toLowerCase().includes("price") || message.toLowerCase().includes("fare")) {
        nextErrors.pricePerSeat = message;
      }
      if (message.toLowerCase().includes("seats")) {
        nextErrors.totalSeats = message;
      }
      if (message.toLowerCase().includes("licence") || message.toLowerCase().includes("license")) {
        nextErrors.drivingLicenseNumber = message;
      }
      if (message.toLowerCase().includes("registration") || message.toLowerCase().includes("vehicle")) {
        nextErrors.vehicleRegistrationNumber = message;
      }
      if (message.toLowerCase().includes("emergency contact name")) {
        nextErrors.emergencyContactName = message;
      }
      if (message.toLowerCase().includes("emergency contact phone")) {
        nextErrors.emergencyContactPhone = message;
      }
    });

    return nextErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const nextValue =
        name === "departureDate" && value && value < minDepartureDate
          ? ""
          : ["totalSeats", "pricePerSeat"].includes(name)
            ? parseInt(value)
            : value;

      const next = {
        ...prev,
        [name]: nextValue,
      };
      const message =
        name === "departureDate" && value && value < minDepartureDate
          ? "Invalid date"
          : validateField(name, next[name], next);

      setFieldErrors((prevErrors) => ({ ...prevErrors, [name]: message }));
      if (name === "from" || name === "to") {
        const fromMsg = validateField("from", next.from, next);
        const toMsg = validateField("to", next.to, next);
        setFieldErrors((prevErrors) => ({ ...prevErrors, from: fromMsg, to: toMsg }));
      }
      if (name === "departureDate" || name === "departureTime") {
        const dateMsg = validateField("departureDate", next.departureDate, next);
        const timeMsg = validateField("departureTime", next.departureTime, next);
        setFieldErrors((prevErrors) => ({ ...prevErrors, departureDate: dateMsg, departureTime: timeMsg }));
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const errors = validateAll(formData);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      const firstMessage = Object.values(errors).find(Boolean);
      if (firstMessage) {
        setError(firstMessage);
      }
      return;
    }

    try {
      setLoading(true);
      await axios.post("/api/rides", formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setSuccessMessage("Ride created successfully!");
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (Array.isArray(apiErrors)) {
        const nextErrors = mapApiErrorsToFields(apiErrors);
        if (Object.keys(nextErrors).length > 0) {
          setFieldErrors((prevErrors) => ({ ...prevErrors, ...nextErrors }));
        }
        const firstMessage = apiErrors.find((item) => item?.message)?.message;
        setError(firstMessage || err.response?.data?.message || "Validation Error");
      } else {
        setError(err.response?.data?.message || "Failed to create ride");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTimePartChange = (part, value) => {
    setTimeParts((prevParts) => {
      const nextParts = {
        ...prevParts,
        [part]: value,
      };

      setFormData((prevForm) => {
        const nextForm = {
          ...prevForm,
          departureTime: convert12HourTo24Hour(nextParts.hour, nextParts.minute, nextParts.meridiem),
        };

        const dateMsg = validateField("departureDate", nextForm.departureDate, nextForm);
        const timeMsg = validateField("departureTime", nextForm.departureTime, nextForm);
        setFieldErrors((prevErrors) => ({ ...prevErrors, departureDate: dateMsg, departureTime: timeMsg }));

        return nextForm;
      });

      return nextParts;
    });
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const message = validateField(name, value, formData);

    if (message && String(value || "").trim()) {
      setFormData((prev) => ({ ...prev, [name]: "" }));
    }

    setFieldErrors((prevErrors) => ({ ...prevErrors, [name]: message }));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {successMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl animate-slide-up">
            <div className="mx-auto mb-4 grid h-14 w-14 place-content-center rounded-full bg-emerald-100 text-2xl font-bold text-emerald-600">
              OK
            </div>
            <h2 className="text-xl font-bold text-slate-900">Success</h2>
            <p className="mt-2 text-sm text-slate-600">{successMessage}</p>
            <button
              type="button"
              onClick={() => {
                setSuccessMessage("");
                navigate("/dashboard");
              }}
              className="btn-primary mt-6 w-full justify-center"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-bold mb-8">Create a New Ride</h1>

      <div className="bg-white rounded-lg shadow-md p-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block font-semibold mb-2">From *</label>
              <input
                type="text"
                name="from"
                value={formData.from}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Starting city (e.g., Bengaluru)"
                className="input-field"
                required
              />
              {fieldErrors.from && <p className="text-sm text-red-600 mt-1">{fieldErrors.from}</p>}
            </div>

            <div>
              <label className="block font-semibold mb-2">To *</label>
              <input
                type="text"
                name="to"
                value={formData.to}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Destination city (e.g., Chennai)"
                className="input-field"
                required
              />
              {fieldErrors.to && <p className="text-sm text-red-600 mt-1">{fieldErrors.to}</p>}
            </div>

            <div>
              <label className="block font-semibold mb-2">Departure Date *</label>
              <input
                type="date"
                name="departureDate"
                value={formData.departureDate}
                onChange={handleChange}
                min={minDepartureDate}
                className="input-field"
                required
              />
              {fieldErrors.departureDate && <p className="text-sm text-red-600 mt-1">{fieldErrors.departureDate}</p>}
            </div>

            <div>
              <label className="block font-semibold mb-2">Departure Time *</label>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
                <select
                  value={timeParts.hour}
                  onChange={(e) => handleTimePartChange("hour", e.target.value)}
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  required
                >
                  <option value="">Hour</option>
                  {Array.from({ length: 12 }, (_, index) => {
                    const hour = String(index + 1);
                    return (
                      <option key={hour} value={hour}>
                        {hour.padStart(2, "0")}
                      </option>
                    );
                  })}
                </select>

                <span className="text-base font-semibold text-slate-400">:</span>

                <select
                  value={timeParts.minute}
                  onChange={(e) => handleTimePartChange("minute", e.target.value)}
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  required
                >
                  <option value="">Minute</option>
                  {Array.from({ length: 60 }, (_, index) => {
                    const minute = String(index).padStart(2, "0");
                    return (
                      <option key={minute} value={minute}>
                        {minute}
                      </option>
                    );
                  })}
                </select>

                <select
                  value={timeParts.meridiem}
                  onChange={(e) => handleTimePartChange("meridiem", e.target.value)}
                  className="w-24 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  required
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
              {fieldErrors.departureTime && <p className="text-sm text-red-600 mt-1">{fieldErrors.departureTime}</p>}
            </div>

            <div>
              <label className="block font-semibold mb-2">Car Model</label>
              <input
                type="text"
                name="carModel"
                value={formData.carModel}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g., Maruti Suzuki Ertiga"
                className="input-field"
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">Total Seats</label>
              <input
                type="number"
                name="totalSeats"
                value={formData.totalSeats}
                onChange={handleChange}
                min="1"
                max="8"
                className="input-field"
              />
              {fieldErrors.totalSeats && <p className="text-sm text-red-600 mt-1">{fieldErrors.totalSeats}</p>}
            </div>

            <div>
              <label className="block font-semibold mb-2">Fare per Seat (INR)</label>
              <input
                type="number"
                name="pricePerSeat"
                value={formData.pricePerSeat}
                onChange={handleChange}
                min="0"
                step="1"
                className="input-field"
              />
              {fieldErrors.pricePerSeat && <p className="text-sm text-red-600 mt-1">{fieldErrors.pricePerSeat}</p>}
            </div>

            <div>
              <label className="block font-semibold mb-2">Driving Licence Number *</label>
              <input
                type="text"
                name="drivingLicenseNumber"
                value={formData.drivingLicenseNumber}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g., TS09 20240012345"
                className="input-field"
                required
              />
              {fieldErrors.drivingLicenseNumber && <p className="text-sm text-red-600 mt-1">{fieldErrors.drivingLicenseNumber}</p>}
            </div>

            <div>
              <label className="block font-semibold mb-2">Vehicle Registration Number *</label>
              <input
                type="text"
                name="vehicleRegistrationNumber"
                value={formData.vehicleRegistrationNumber}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g., TS09AB1234"
                className="input-field"
                required
              />
              {fieldErrors.vehicleRegistrationNumber && <p className="text-sm text-red-600 mt-1">{fieldErrors.vehicleRegistrationNumber}</p>}
            </div>

            <div>
              <label className="block font-semibold mb-2">Emergency Contact Name *</label>
              <input
                type="text"
                name="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Person to contact in emergency"
                className="input-field"
                required
              />
              {fieldErrors.emergencyContactName && <p className="text-sm text-red-600 mt-1">{fieldErrors.emergencyContactName}</p>}
            </div>

            <div>
              <label className="block font-semibold mb-2">Emergency Contact Phone *</label>
              <input
                type="tel"
                name="emergencyContactPhone"
                value={formData.emergencyContactPhone}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g., 9876543210"
                className="input-field"
                required
              />
              {fieldErrors.emergencyContactPhone && <p className="text-sm text-red-600 mt-1">{fieldErrors.emergencyContactPhone}</p>}
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-2">Additional Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g., Pickup near metro station, one luggage per rider"
              rows="4"
              className="input-field"
            ></textarea>
          </div>

          <div className="flex gap-4">
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? "Creating..." : "Create Ride"}
            </button>
            <button type="button" onClick={() => navigate("/dashboard")} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRide;
