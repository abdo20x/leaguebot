// Free Agent commands - تقديم and related commands
import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
  GuildMember,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  User,
  MessageCreateOptions,
  ChannelType
} from "discord.js";
import { storage } from "../../storage";
import { formatCurrency } from "../utils";
import { createBaseEmbed } from "../embeds";

// Free Agent application command
const freeAgentCommand = {
  data: new SlashCommandBuilder()
    .setName('freeagent')
    .setDescription('Submit your free agent application')
    .addSubcommand(subcommand =>
      subcommand
        .setName('apply')
        .setDescription('Apply as a free agent')
    ),
  
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    // Process application in DMs
    await handleFreeAgentApplication(interaction);
  }
};

// Arabic version - تقديم command (primary command)
const freeAgentArabicCommand = {
  data: new SlashCommandBuilder()
    .setName('تقديم')
    .setDescription('تقديم طلب كلاعب حر'),
  
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    // Process application in DMs
    await handleFreeAgentApplication(interaction);
  }
};

// Helper function to handle free agent applications
async function handleFreeAgentApplication(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });
  
  const serverId = interaction.guildId;
  if (!serverId) {
    await interaction.editReply({ content: 'هذا الأمر يمكن استخدامه فقط في سيرفر!' });
    return;
  }
  
  const user = interaction.user;
  const member = interaction.member as GuildMember;
  
  // Check if user already has a team
  const player = await storage.getPlayerByUserId(serverId, user.id);
  if (player && player.teamId) {
    const team = await storage.getTeam(player.teamId);
    await interaction.editReply({ 
      content: `أنت بالفعل عضو في فريق ${team?.name}. يجب عليك مغادرة الفريق الحالي قبل التقديم كلاعب حر.` 
    });
    return;
  }
  
  try {
    // Inform the user that the bot will DM them
    await interaction.editReply({ 
      content: `سيتم إرسال نموذج التقديم إليك عبر الرسائل الخاصة. يرجى التأكد من أن رسائلك الخاصة مفتوحة.` 
    });
    
    // Start the application process in DMs
    await startPositionQuestion(user);
  } catch (error) {
    console.error('Error processing free agent application:', error);
    await interaction.editReply({ 
      content: 'حدث خطأ أثناء معالجة طلبك. يرجى التأكد من أن رسائلك الخاصة مفتوحة واحاول مرة أخرى.' 
    });
  }
}

// Question 1: Position (ايش مركزك)
async function startPositionQuestion(user: User): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor('#3498db')
    .setTitle('📝 نموذج تقديم لاعب حر')
    .setDescription('ايش مركزك؟')
    .setFooter({ text: 'الخطوة 1 من 3' });
  
  const row = new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('position_select')
        .setPlaceholder('اختر مركزك')
        .addOptions([
          new StringSelectMenuOptionBuilder()
            .setLabel('CF - مهاجم صريح')
            .setValue('CF')
            .setEmoji('⚽'),
          new StringSelectMenuOptionBuilder()
            .setLabel('RW - جناح أيمن')
            .setValue('RW')
            .setEmoji('🏃'),
          new StringSelectMenuOptionBuilder()
            .setLabel('LW - جناح أيسر')
            .setValue('LW')
            .setEmoji('🏃'),
          new StringSelectMenuOptionBuilder()
            .setLabel('CM - وسط')
            .setValue('CM')
            .setEmoji('🎮'),
        ])
    );
  
  try {
    await user.send({ embeds: [embed], components: [row] });
  } catch (error) {
    console.error('Failed to send DM to user:', error);
    // The interaction was already deferred and replied to, so no need to reply again
  }
}

// Question 2: Stats
async function askStatsQuestion(user: User, position: string): Promise<void> {
  let question = '';
  
  // Ask same question for all positions as specified
  question = 'كم عدد اسيستاتك و اهدافك؟';
  
  const embed = new EmbedBuilder()
    .setColor('#3498db')
    .setTitle('📝 نموذج تقديم لاعب حر')
    .setDescription(question)
    .setFooter({ text: 'الخطوة 2 من 3' });
  
  await user.send({ embeds: [embed] });
  
  // Note: We'll handle the response in a message collector in the Discord client bot implementation
}

// Question 3: Preferred Team
async function askPreferredTeamQuestion(user: User, serverId: string): Promise<void> {
  const teams = await storage.getTeams(serverId);
  
  const embed = new EmbedBuilder()
    .setColor('#3498db')
    .setTitle('📝 نموذج تقديم لاعب حر')
    .setDescription('اي فريق حابب تدخل')
    .setFooter({ text: 'الخطوة 3 من 3' });
  
  // Create select menu with available teams
  const options: StringSelectMenuOptionBuilder[] = teams.map(team => 
    new StringSelectMenuOptionBuilder()
      .setLabel(`${team.name}`)
      .setValue(`${team.id}`)
      .setEmoji(team.emoji)
      .setDescription(`Roster: ${team.rosterCount || 0}/${team.rosterMax || 30}`)
  );
  
  const row = new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('team_select')
        .setPlaceholder('اختر الفريق')
        .addOptions(options)
    );
  
  await user.send({ embeds: [embed], components: [row] });
}

// Submit application to channel
async function submitApplication(
  user: User, 
  serverId: string,
  position: string,
  stats: string,
  preferredTeam: string
): Promise<void> {
  const settings = await storage.getSettings(serverId);
  const channels = await storage.getChannels(serverId);
  const guild = await user.client.guilds.fetch(serverId);
  
  // Check if free agent applications channel exists
  const channelId = channels?.applications || '';
  if (!channelId) {
    await user.send('لم يتم تحديد قناة لتقديمات اللاعبين الأحرار في السيرفر. يرجى التواصل مع الإدارة.');
    return;
  }
  
  const channel = await guild.channels.fetch(channelId);
  if (!channel || channel.type !== ChannelType.GuildText) {
    await user.send('تعذر العثور على قناة التقديمات. يرجى التواصل مع الإدارة.');
    return;
  }
  
  // Get preferred team
  const team = await storage.getTeam(parseInt(preferredTeam));
  
  // Create a smaller, more compact embed for application
  const embed = new EmbedBuilder()
    .setColor('#00ff00')
    .setAuthor({ 
      name: `تقديم لاعب حر: ${user.username}`,
      iconURL: user.displayAvatarURL()
    })
    .setDescription(
      `**المركز:** ${position}\n` +
      `**الإحصائيات:** ${stats}\n` +
      `**الفريق المفضل:** ${team ? `${team.emoji} ${team.name}` : 'غير محدد'}`
    )
    .setFooter({ text: 'Win Lock Bot' });
  
  // Send to applications channel
  await (channel as TextChannel).send({ embeds: [embed] });
  
  // Confirm to user
  await user.send({
    embeds: [
      new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('✅ تم إرسال طلب التقديم بنجاح')
        .setDescription('تم إرسال طلبك إلى قناة تقديمات اللاعبين الأحرار. سيتم التواصل معك قريباً.')
    ]
  });
}

export const freeAgentCommands = [
  freeAgentCommand,
  freeAgentArabicCommand
];