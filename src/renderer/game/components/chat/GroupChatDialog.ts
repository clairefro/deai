import { ChatDialog } from "./ChatDialog";
import { ChatDialogUiManager } from "./ChatDialogUiManager";
import { Librarian } from "../../models/Librarian";
import { MessageWithMeta } from "../../llm/ChatAdapter";

interface Participant {
  id: string;
  name: string;
  librarian?: Librarian;
  lastMessageTime?: number;
}

export class GroupChatDialog extends ChatDialog {
  private participants: Map<string, Participant> = new Map();
  private readonly REPLY_CHANCE = 0.7; // 70% chance to reply
  private readonly MIN_REPLY_DELAY = 2000;
  private readonly MAX_REPLY_DELAY = 5000;

  constructor(scene: Phaser.Scene, playerName: string, onClose?: () => void) {
    super(
      "You are in a group conversation. Keep responses natural and engaging.",
      scene,
      onClose
    );

    // Add player as first participant
    this.addParticipant({ id: "player", name: playerName });
  }

  addLibrarian(librarian: Librarian): void {
    this.addParticipant({
      id: librarian.getId(),
      name: librarian.getName(),
      librarian,
    });
    this.refreshSystemPrompt();
  }

  private addParticipant(participant: Participant): void {
    this.participants.set(participant.id, participant);
  }

  private refreshSystemPrompt(): void {
    const participants = Array.from(this.participants.values())
      .map((p) => p.name)
      .join(", ");

    const prompt = `You are in a group conversation with a user and simulacra: ${participants}.
Each participant has their own unique personality and perspective. 
You are all wandering the Library of Babel. 
You may respond to any message, whether from the player or other simulacra participants.
Keep responses but concise. Respond in the voice of the current persona.`;

    super.updateSystemPrompt(prompt);
  }

  override async handleMessage(message: string): Promise<void> {
    // Update sender's last message time
    const sender = this.participants.get("player");
    if (sender) {
      sender.lastMessageTime = Date.now();
    }

    await super.handleMessage(message);

    // Maybe trigger AI responses
    this.considerAIResponses();
  }

  private async considerAIResponses(): Promise<void> {
    if (Math.random() > this.REPLY_CHANCE) return;

    // Find librarians who haven't spoken recently
    const eligibleLibrarians = Array.from(this.participants.values()).filter(
      (p) => p.librarian && this.canRespond(p)
    );

    if (eligibleLibrarians.length === 0) return;

    // Pick random librarian to respond
    const respondent =
      eligibleLibrarians[Math.floor(Math.random() * eligibleLibrarians.length)];

    // Add thinking indicator
    this.ui.showLoading(`${respondent.name} is thinking...`);

    // Random delay before response
    await new Promise((resolve) =>
      setTimeout(
        resolve,
        Math.random() * (this.MAX_REPLY_DELAY - this.MIN_REPLY_DELAY) +
          this.MIN_REPLY_DELAY
      )
    );

    try {
      const response = await this.chatManager.sendMessage("", {
        speaker: respondent.name,
        role: "assistant",
      });

      respondent.lastMessageTime = Date.now();
      this.ui.hideLoading();

      // Add message with speaker attribution
      this.ui.addMessage({
        role: "assistant",
        content: response.content,
        speaker: respondent.name,
      });
    } catch (err) {
      console.error("AI response error:", err);
      this.ui.hideLoading();
    }
  }

  private canRespond(participant: Participant): boolean {
    if (!participant.lastMessageTime) return true;
    return Date.now() - participant.lastMessageTime > 5000; // 5s cooldown
  }
}
