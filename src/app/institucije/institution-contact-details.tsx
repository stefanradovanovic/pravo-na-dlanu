import type { InstitutionContact } from "@/lib/institution-directory";

export function InstitutionContactDetails({
  contact,
  name,
}: {
  contact: InstitutionContact;
  name: string;
}) {
  const { addresses, phone, email, source } = contact;
  return (
    <div className="institution-contact leading-snug">
      <dl>
        <div>
          <dt>{addresses.length === 1 ? "Адреса" : "Адресе"}</dt>
          {addresses.map((address) => (
            <dd key={address}>{address}</dd>
          ))}
        </div>
        {phone && (
          <div>
            <dt>Телефон</dt>
            <dd>
              <a
                className="text-link"
                href={`tel:${phone.number.replace(/\s/g, "")}`}
              >
                {phone.number}
              </a>
              {phone.label && ` · ${phone.label}`}
            </dd>
          </div>
        )}
        {email && (
          <div>
            <dt>Е-пошта</dt>
            <dd>
              <a className="text-link" href={`mailto:${email.address}`}>
                {email.address}
              </a>
              {" · "}
              {email.label}
            </dd>
          </div>
        )}
      </dl>
      <a className="text-link" href={source}>
        Извор контакта<span className="sr-only"> · {name}</span>
      </a>
    </div>
  );
}
