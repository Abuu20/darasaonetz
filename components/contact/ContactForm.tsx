import { useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { emailService } from "@/lib/db/email";
import { useLanguage } from "@/context/LanguageContext";
import images from "@/assets/images.json";

type Field = "name" | "email" | "phone" | "role" | "message";

const FIELDS = [
  { id: "name", name: "name" as Field, type: "text", required: true, labelKey: "components.contact.ContactForm.name.label", placeholderKey: "components.contact.ContactForm.name.placeholder" },
  { id: "email", name: "email" as Field, type: "email", required: true, labelKey: "components.contact.ContactForm.email.label", placeholderKey: "components.contact.ContactForm.email.placeholder" },
  { id: "phone", name: "phone" as Field, type: "tel", required: false, labelKey: "components.contact.ContactForm.phone.label", placeholderKey: "components.contact.ContactForm.phone.placeholder" },
  { id: "role", name: "role" as Field, type: "text", required: false, labelKey: "components.contact.ContactForm.role.label", placeholderKey: "components.contact.ContactForm.role.placeholder" },
  { id: "message", name: "message" as Field, type: "text", required: true, labelKey: "components.contact.ContactForm.message.label", placeholderKey: "components.contact.ContactForm.message.placeholder" },
] as const;

export default function ContactForm() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<Record<Field, string>>({ name: "", email: "", phone: "", role: "", message: "" });
  const [touched, setTouched] = useState<Record<Field, boolean>>({ name: false, email: false, phone: false, role: false, message: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formError, setFormError] = useState("");

  const validations: Record<Field, boolean> = {
    name: formData.name.trim().length > 0,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email),
    phone: formData.phone.trim().length === 0 || /^[+\d][\d\s\-()]{6,20}$/.test(formData.phone),
    role: true,
    message: formData.message.trim().length > 0,
  };

  const handleChange = (name: Field, value: string) => setFormData(prev => ({ ...prev, [name]: value }));
  const handleBlur = (name: Field) => setTouched(prev => ({ ...prev, [name]: true }));

  const renderIcon = (name: Field, required: boolean) => {
    if (!touched[name]) return null;
    const valid = validations[name];
    if (valid && (required || formData[name].trim().length > 0)) {
      return (
        <img src={images["icons.check"]} data-image-id="icons.check" alt="" aria-hidden="true" className="absolute right-0 top-1/2 h-5 w-5 -translate-y-1/2" />
      );
    }
    if (!valid) {
      return (
        <img src={images["icons.cross"]} data-image-id="icons.cross" alt="" aria-hidden="true" className="absolute right-0 top-1/2 h-5 w-5 -translate-y-1/2" />
      );
    }
    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    if (!validations.name || !validations.email || !validations.message) {
      setTouched({ name: true, email: true, phone: true, role: true, message: true });
      setFormError(t("components.contact.ContactForm.invalid"));
      return;
    }
    setIsSubmitting(true);
    try {
      await emailService.sendContactMessage(formData);
      setSubmitSuccess(true);
      setFormData({ name: "", email: "", phone: "", role: "", message: "" });
      setTouched({ name: false, email: false, phone: false, role: false, message: false });
      setTimeout(() => setSubmitSuccess(false), 6000);
    } catch (err) {
      console.error("[Contact form] error:", err);
      setFormError(t("components.contact.ContactForm.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-block">
      {submitSuccess ? (
        <motion.div
          initial={{ opacity: 0.001, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-panel border border-success bg-success/10 px-stack py-tight text-sm text-ink"
        >
          <span data-text-id="components.contact.ContactForm.success">{t("components.contact.ContactForm.success")}</span>
        </motion.div>
      ) : null}
      {formError ? (
        <div className="rounded-panel border border-danger bg-danger/10 px-stack py-tight text-sm text-ink">{formError}</div>
      ) : null}

      <form className="flex flex-col gap-block" onSubmit={handleSubmit} noValidate>
        {FIELDS.map((field, index) => (
          <motion.div
            key={field.id}
            initial={{ opacity: 0.001, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: index * 0.06, ease: "easeOut" }}
            className="flex flex-col gap-1 border-b border-line pb-2 transition-colors duration-base focus-within:border-ink hover:border-ink"
          >
            <label className="text-sm text-ink" htmlFor={`contact-${field.id}`}>
              <span data-text-id={field.labelKey}>{t(field.labelKey)}</span>
            </label>
            <div className="relative w-full">
              <input
                id={`contact-${field.id}`}
                name={field.name}
                type={field.type}
                required={field.required}
                value={formData[field.name]}
                onChange={event => handleChange(field.name, event.target.value)}
                onBlur={() => handleBlur(field.name)}
                placeholder={t(field.placeholderKey)}
                className="w-full bg-transparent pr-8 text-base text-ink outline-none transition-colors duration-base placeholder:text-line focus:placeholder:text-slate"
              />
              {renderIcon(field.name, field.required)}
            </div>
          </motion.div>
        ))}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-stack w-fit rounded-pill bg-ink px-block py-tight text-sm text-ink-foreground transition-colors duration-base hover:bg-primary disabled:opacity-60"
        >
          <span data-text-id={isSubmitting ? "components.contact.ContactForm.sending" : "components.contact.ContactForm.submit"}>
            {isSubmitting ? t("components.contact.ContactForm.sending") : t("components.contact.ContactForm.submit")}
          </span>
        </button>
      </form>
    </div>
  );
}
