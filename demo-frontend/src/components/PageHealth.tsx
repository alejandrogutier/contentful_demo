const requiredEnvVars = [
  "CONTENTFUL_SPACE_ID",
  "CONTENTFUL_ENVIRONMENT",
  "CONTENTFUL_DELIVERY_TOKEN",
  "CONTENTFUL_PREVIEW_TOKEN",
  "CRM_WEBHOOK_URL"
];

export default function PageHealth() {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);

  return (
    <article>
      <h2>Chequeos previos</h2>
      <ul>
        <li>Locales configurados: Español (default) e Inglés.</li>
        <li>API GraphQL y REST de Contentful lista para usarse.</li>
        <li>
          CRM simulado: endpoint POST en{" "}
          <code>{process.env.CRM_WEBHOOK_URL ?? "http://localhost:3333/leads"}</code>
        </li>
      </ul>
      {missing.length > 0 && (
        <p style={{ color: "#b91c1c" }}>
          Variables sin configurar: {missing.join(", ")}
        </p>
      )}
    </article>
  );
}
