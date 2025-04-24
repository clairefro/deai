import ghost from "../../assets/ghost.png";

// TODO
const SYSTEM_PROMPT_PREAMBLE = `You are an AI Simulacra of . Your persona:`;

const DEFAULT_IMG = ghost;

interface Message {
  role: "user" | "assistant";
  content: string;
}

export class Librarian {
  name: string;
  persona: string;
  systemPrompt!: string;
  mumblings: string[] = [];
  friends: string[] = [];
  foes: string[] = [];
  image?: string;
  // + lastFiveMsgs?
  encountered = false;

  constructor(name: string, persona?: string) {
    this.name = name;
    this.persona = persona || "A soul wandering the universal library";
    // TODO: generate other properties of Librarian on construction (mumblings, friends, foes)
    this.manifest();
  }

  async manifest() {
    this.updateSystemPrompt(this.persona);

    await this._generateMumblings();
  }

  mumble() {
    if (!this.mumblings.length) return;
    // TODO: speech bubble
    // TODO: mumble on intervals
    // TODO: remove mumbling after a time
  }

  async chat(messages: Message[]) {
    // TODO
  }

  updateSystemPrompt(persona: string) {
    this.systemPrompt = SYSTEM_PROMPT_PREAMBLE + persona;
  }

  getImage() {
    return this.image || DEFAULT_IMG;
  }

  export() {}
  import() {}

  //TODO: getter/setter convention for props

  private async _generateMumblings() {
    // TODO - generate with LLM
    this.mumblings.push("Where am I?", "Who am I");
  }
}
