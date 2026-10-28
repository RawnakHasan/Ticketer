import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { TextField } from "@/components/ui/TextField";
import { fieldsFor, makeSerial, SAMPLES, showKeyOf } from "@/lib/ticket/fields";
import { useTicketerStore } from "@/stores/ticketerStore";

export function DetailsStep() {
  const tpl = useTicketerStore((s) => s.settings.tpl);
  const fields = useTicketerStore((s) => s.settings.fields);
  const show = useTicketerStore((s) => s.settings.show);
  const setField = useTicketerStore((s) => s.setField);
  const setFields = useTicketerStore((s) => s.setFields);
  const setShow = useTicketerStore((s) => s.setShow);

  function shuffleSample() {
    const [title, sub, place] = SAMPLES[Math.floor(Math.random() * SAMPLES.length)];
    setFields({ title, sub, place, serial: makeSerial() });
  }

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex flex-wrap gap-2">
        <Button variant="tonal" onClick={shuffleSample}>
          Shuffle sample text
        </Button>
        <Button variant="text" onClick={() => setField("serial", makeSerial())}>
          New serial
        </Button>
      </div>

      {fieldsFor(tpl).map((field) => {
        const showKey = showKeyOf(field);
        const visible = show[showKey] ?? true;

        return (
          <div key={field.key} className="flex items-start gap-3">
            <TextField
              variant="outlined"
              label={field.label}
              value={fields[field.key] ?? ""}
              disabled={!visible}
              onChange={(event) => setField(field.key, event.target.value)}
              className="min-w-0 flex-1"
            />
            {/* The switch is 32px tall and the field 56px, so it needs 12px to line up */}
            <Switch
              aria-label={`Show ${field.label}`}
              checked={visible}
              onCheckedChange={(checked) => setShow(showKey, checked)}
              className="mt-3"
            />
          </div>
        );
      })}
    </div>
  );
}
