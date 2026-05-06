import Phaser from "phaser";
import { Character, CharacterId } from "../entities/Character";
import { SpeechBubble } from "../ui/SpeechBubble";
import dialogueData from "../data/dialogue.json";

interface DialogueLine {
  speaker: CharacterId;
  text: string;
}

interface QueuedLine extends DialogueLine {
  audioKey: string;
  onDone?: () => void;
}

const LINE_DURATION_MS = 1800;

export class DialogueManager {
  private bubble: SpeechBubble;
  private queue: QueuedLine[] = [];
  private current: QueuedLine | null = null;
  private timer: Phaser.Time.TimerEvent | null = null;
  private characters: Map<CharacterId, Character>;
  private onIdleCallback: (() => void) | null = null;

  constructor(
    private scene: Phaser.Scene,
    characters: Character[],
  ) {
    this.bubble = new SpeechBubble(scene);
    this.characters = new Map(characters.map((c) => [c.id, c]));
  }

  speakLine(lineId: string, onDone?: () => void): void {
    const data = (dialogueData as Record<string, DialogueLine | DialogueLine[]>)[lineId];
    if (!data) {
      console.warn(`Missing dialogue line: ${lineId}`);
      onDone?.();
      return;
    }
    if (Array.isArray(data)) {
      const lines = [...data];
      const last = lines.length - 1;
      lines.forEach((l, i) =>
        this.enqueue({
          ...l,
          audioKey: `speech:${lineId}-${i}`,
          onDone: i === last ? onDone : undefined,
        }),
      );
    } else {
      this.enqueue({ ...data, audioKey: `speech:${lineId}`, onDone });
    }
  }

  isSpeaking(): boolean {
    return this.current !== null || this.queue.length > 0;
  }

  whenIdle(cb: () => void): void {
    if (!this.isSpeaking()) {
      cb();
      return;
    }
    this.onIdleCallback = cb;
  }

  update(): void {
    this.bubble.update();
  }

  private enqueue(line: QueuedLine): void {
    this.queue.push(line);
    if (!this.current) this.advance();
  }

  private advance(): void {
    if (this.timer) {
      this.timer.remove(false);
      this.timer = null;
    }
    const next = this.queue.shift() ?? null;
    if (!next) {
      this.bubble.hide();
      const prev = this.current;
      this.current = null;
      prev?.onDone?.();
      const idleCb = this.onIdleCallback;
      this.onIdleCallback = null;
      idleCb?.();
      return;
    }
    this.current = next;
    const speaker = this.characters.get(next.speaker);
    if (!speaker) {
      console.warn(`Missing speaker: ${next.speaker}`);
      this.advance();
      return;
    }
    this.bubble.show(speaker, next.text);
    if (this.scene.cache.audio.exists(next.audioKey)) {
      this.scene.sound.play(next.audioKey, { volume: 0.6 });
    }
    const duration = Math.max(LINE_DURATION_MS, next.text.length * 70);
    this.timer = this.scene.time.delayedCall(duration, () => {
      const prev = this.current;
      this.current = null;
      prev?.onDone?.();
      this.advance();
    });
  }
}
