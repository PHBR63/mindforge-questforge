import { useState, useCallback } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, FileJson, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { NODE_TYPES, CONNECTION_TYPES, NodeType } from './types';

// Zod schema for validation
const nodeSchema = z.object({
  ref: z.string().min(1, 'ref é obrigatório'),
  title: z.string().min(1, 'title é obrigatório').max(200, 'title deve ter no máximo 200 caracteres'),
  content: z.string().max(5000).nullable().optional(),
  nodeType: z.enum(['idea', 'npc', 'location', 'quest', 'faction', 'event', 'item']).default('idea'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida (use formato #rrggbb)').nullable().optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
});

const connectionSchema = z.object({
  source: z.string().min(1, 'source é obrigatório'),
  target: z.string().min(1, 'target é obrigatório'),
  label: z.string().max(100).nullable().optional(),
  connectionType: z.enum(['default', 'causes', 'leads_to', 'related', 'opposes', 'supports']).default('default'),
});

const importSchema = z.object({
  version: z.string().optional(),
  nodes: z.array(nodeSchema).min(1, 'Pelo menos 1 nó é necessário').max(200, 'Máximo de 200 nós'),
  connections: z.array(connectionSchema).max(500, 'Máximo de 500 conexões').default([]),
});

export type ImportJsonData = z.infer<typeof importSchema>;

interface ImportJsonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: ImportJsonData) => Promise<void>;
}

export function ImportJsonDialog({ open, onOpenChange, onImport }: ImportJsonDialogProps) {
  const { toast } = useToast();
  const [jsonText, setJsonText] = useState('');
  const [parsedData, setParsedData] = useState<ImportJsonData | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [step, setStep] = useState<'input' | 'preview'>('input');

  const resetState = () => {
    setJsonText('');
    setParsedData(null);
    setErrors([]);
    setStep('input');
    setIsImporting(false);
  };

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      setErrors(['Arquivo muito grande. Máximo: 1MB']);
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setJsonText(text);
      validateJson(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  const validateJson = (text: string) => {
    setErrors([]);
    setParsedData(null);

    if (!text.trim()) {
      setErrors(['JSON vazio']);
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setErrors(['JSON inválido. Verifique a sintaxe.']);
      return;
    }

    const result = importSchema.safeParse(parsed);
    if (!result.success) {
      const msgs = result.error.issues.map(
        (i) => `${i.path.join('.')}: ${i.message}`
      );
      setErrors(msgs);
      return;
    }

    // Check ref uniqueness
    const refs = result.data.nodes.map((n) => n.ref);
    const dupes = refs.filter((r, i) => refs.indexOf(r) !== i);
    if (dupes.length > 0) {
      setErrors([`Refs duplicados: ${[...new Set(dupes)].join(', ')}`]);
      return;
    }

    // Check connection refs exist
    const refSet = new Set(refs);
    const badConns: string[] = [];
    result.data.connections.forEach((c, i) => {
      if (!refSet.has(c.source)) badConns.push(`connections[${i}].source "${c.source}" não existe`);
      if (!refSet.has(c.target)) badConns.push(`connections[${i}].target "${c.target}" não existe`);
    });
    if (badConns.length > 0) {
      setErrors(badConns);
      return;
    }

    setParsedData(result.data);
    setStep('preview');
  };

  const handleValidate = () => {
    validateJson(jsonText);
  };

  const handleImport = async () => {
    if (!parsedData) return;
    setIsImporting(true);

    try {
      await onImport(parsedData);
      toast({ title: 'Importado com sucesso!', description: `${parsedData.nodes.length} nós e ${parsedData.connections.length} conexões criados.` });
      resetState();
      onOpenChange(false);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro na importação', description: err?.message || 'Erro desconhecido' });
    } finally {
      setIsImporting(false);
    }
  };

  const nodeTypeCounts = parsedData
    ? parsedData.nodes.reduce<Record<string, number>>((acc, n) => {
        acc[n.nodeType] = (acc[n.nodeType] || 0) + 1;
        return acc;
      }, {})
    : {};

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetState(); onOpenChange(o); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <FileJson className="w-5 h-5" />
            Importar Mapa Mental (JSON)
          </DialogTitle>
          <DialogDescription>
            Cole o JSON ou faça upload de um arquivo .json
          </DialogDescription>
        </DialogHeader>

        {step === 'input' && (
          <div className="space-y-4 py-2">
            {/* File upload */}
            <div className="space-y-2">
              <Label>Arquivo JSON</Label>
              <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Clique para selecionar ou arraste um arquivo .json</span>
                <input type="file" accept=".json,application/json" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex-1 h-px bg-border" />
              ou cole o JSON abaixo
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* JSON textarea */}
            <div className="space-y-2">
              <Textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder='{ "nodes": [...], "connections": [...] }'
                className="font-mono text-xs min-h-[200px] max-h-[400px]"
                rows={12}
              />
            </div>

            {/* Errors */}
            {errors.length > 0 && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 space-y-1">
                <div className="flex items-center gap-1 text-sm font-medium text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  Erros de validação
                </div>
                <ul className="text-xs text-destructive/80 list-disc pl-5 space-y-0.5">
                  {errors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        {step === 'preview' && parsedData && (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/30">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">JSON válido!</span>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm font-medium">{parsedData.nodes.length} Nós</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {Object.entries(nodeTypeCounts).map(([type, count]) => {
                    const nodeInfo = NODE_TYPES[type as NodeType];
                    return (
                      <Badge key={type} variant="secondary" className="text-xs">
                        {nodeInfo?.icon} {nodeInfo?.label || type}: {count}
                      </Badge>
                    );
                  })}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm font-medium">{parsedData.connections.length} Conexões</p>
                {parsedData.connections.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {[...new Set(parsedData.connections.map((c) => c.connectionType))].map((type) => {
                      const connInfo = CONNECTION_TYPES.find((t) => t.value === type);
                      return (
                        <Badge key={type} variant="outline" className="text-xs">
                          {connInfo?.label || type}
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Node list preview */}
            <div className="space-y-1">
              <Label>Prévia dos nós</Label>
              <ScrollArea className="h-[200px] rounded-lg border border-border p-2">
                <div className="space-y-1">
                  {parsedData.nodes.map((node) => {
                    const nodeInfo = NODE_TYPES[node.nodeType as NodeType];
                    return (
                      <div key={node.ref} className="flex items-center gap-2 p-2 rounded bg-card text-sm">
                        <span>{nodeInfo?.icon || '💡'}</span>
                        <span className="font-medium truncate flex-1">{node.title}</span>
                        <Badge variant="secondary" className="text-xs">{nodeInfo?.label || node.nodeType}</Badge>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            <Button variant="ghost" size="sm" onClick={() => setStep('input')} className="text-xs">
              ← Voltar ao editor
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => { resetState(); onOpenChange(false); }}>
            Cancelar
          </Button>
          {step === 'input' ? (
            <Button onClick={handleValidate} disabled={!jsonText.trim()}>
              Validar JSON
            </Button>
          ) : (
            <Button onClick={handleImport} disabled={isImporting}>
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Importar {parsedData?.nodes.length} nós
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
