"use client";

import { useState, FormEvent } from "react";

export type LeadField =
  | {
      id: string;
      label: string;
      type: "text" | "email" | "phone" | "textarea";
      required?: boolean;
    }
  | {
      id: string;
      label: string;
      type: "select";
      required?: boolean;
      options: Array<{ label: string; value: string }>;
    };

export type LeadFormConfig = {
  sysId: string;
  title: string;
  description?: string;
  fields: LeadField[];
  successMessage?: string;
};

type Props = {
  config: LeadFormConfig;
};

export default function LeadForm({ config }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setError(null);

    const formData = new FormData(event.currentTarget);
    const payload: Record<string, string> = {};
    config.fields.forEach((field) => {
      const value = formData.get(field.id);
      if (value) {
        payload[field.id] = value.toString();
      }
    });

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId: config.sysId,
          payload
        })
      });

      if (!response.ok) {
        throw new Error("Error enviando el lead");
      }

      window.dispatchEvent(
        new CustomEvent("crm:lead-sent", {
          detail: {
            formId: config.sysId,
            sentAt: new Date().toISOString(),
            payload
          }
        })
      );

      setStatus("success");
      event.currentTarget.reset();
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError(
        err instanceof Error ? err.message : "No se pudo enviar el formulario"
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <h3>{config.title}</h3>
      {config.description && <p>{config.description}</p>}

      {config.fields.map((field) => {
        if (field.type === "select") {
          return (
            <label key={field.id} style={{ display: "block", marginBottom: 12 }}>
              {field.label}
              <select
                name={field.id}
                required={field.required}
                style={{ width: "100%", padding: 8, marginTop: 4 }}
              >
                <option value="">Selecciona una opción</option>
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          );
        }

        const inputProps = {
          name: field.id,
          required: field.required,
          style: { width: "100%", padding: 8, marginTop: 4 }
        };

        return (
          <label key={field.id} style={{ display: "block", marginBottom: 12 }}>
            {field.label}
            {field.type === "textarea" ? (
              <textarea {...inputProps} rows={3} />
            ) : (
              <input {...inputProps} type={field.type} />
            )}
          </label>
        );
      })}

      <button
        type="submit"
        disabled={status === "loading"}
        style={{
          padding: "0.75rem 1.5rem",
          backgroundColor: "#2563eb",
          color: "white",
          border: 0,
          borderRadius: "8px",
          cursor: "pointer"
        }}
      >
        {status === "loading" ? "Enviando..." : "Enviar lead"}
      </button>

      {status === "success" && (
        <p style={{ color: "#047857", marginTop: 12 }}>
          {config.successMessage ?? "Lead enviado correctamente al CRM simulado."}
        </p>
      )}

      {status === "error" && error && (
        <p style={{ color: "#b91c1c", marginTop: 12 }}>{error}</p>
      )}
    </form>
  );
}
