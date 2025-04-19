import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits
} from "discord.js";
import { storage } from "../../storage";
import { createTransactionEmbed } from "../embeds";
import { formatCurrency } from "../utils";

// Grant money to a team (win) - only for admin
const winCommand = {
  data: new SlashCommandBuilder()
    .setName('win')
    .setDescription('Award win money to a team (Admin only)')
    .addStringOption(option => 
      option.setName('team')
        .setDescription('The team ID or name')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    // Verify user
    if (!interaction.memberPermissions?.has('Administrator')) {
      await interaction.reply({ content: 'أنت غير مخول باستخدام هذا الأمر.', ephemeral: true });
      return;
    }

    await handleCurrencyCommand(interaction, 'win');
  }
};

// Grant money to a team (loss) - only for admin
const lossCommand = {
  data: new SlashCommandBuilder()
    .setName('loss')
    .setDescription('Award loss money to a team (Admin only)')
    .addStringOption(option => 
      option.setName('team')
        .setDescription('The team ID or name')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    // Verify user
    if (!interaction.memberPermissions?.has('Administrator')) {
      await interaction.reply({ content: 'أنت غير مخول باستخدام هذا الأمر.', ephemeral: true });
      return;
    }

    await handleCurrencyCommand(interaction, 'loss');
  }
};

// Arabic versions
const winArabicCommand = {
  data: new SlashCommandBuilder()
    .setName('فوز')
    .setDescription('منح أموال الفوز لفريق (للمشرف فقط)')
    .addStringOption(option => 
      option.setName('team')
        .setDescription('رمز الفريق أو اسمه')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    // Verify user
    if (!interaction.memberPermissions?.has('Administrator')) {
      await interaction.reply({ content: 'أنت غير مخول باستخدام هذا الأمر.', ephemeral: true });
      return;
    }

    await handleCurrencyCommand(interaction, 'win');
  }
};

const lossArabicCommand = {
  data: new SlashCommandBuilder()
    .setName('خسارة')
    .setDescription('منح أموال الخسارة لفريق (للمشرف فقط)')
    .addStringOption(option => 
      option.setName('team')
        .setDescription('رمز الفريق أو اسمه')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    // Verify user
    if (!interaction.memberPermissions?.has('Administrator')) {
      await interaction.reply({ content: 'أنت غير مخول باستخدام هذا الأمر.', ephemeral: true });
      return;
    }

    await handleCurrencyCommand(interaction, 'loss');
  }
};

// Handle currency commands
async function handleCurrencyCommand(
  interaction: ChatInputCommandInteraction, 
  type: 'win' | 'loss'
): Promise<void> {
  await interaction.deferReply();

  const serverId = interaction.guildId;
  if (!serverId) {
    await interaction.editReply({ content: 'هذا الأمر يمكن استخدامه فقط في سيرفر!' });
    return;
  }

  try {
    // Get settings to determine award amounts
    const settings = await storage.getSettings(serverId);
    let amount = 0;

    if (type === 'win') {
      amount = settings?.winCurrency || 10000000; // Default 10M
    } else {
      amount = settings?.lossCurrency || 5000000; // Default 5M
    }

    // Get team 
    const teamIdentifier = interaction.options.getString('team', true);
    let team;

    // Try to find by team name first (case insensitive)
    const teams = await storage.getTeams(serverId);
    team = teams.find(t => 
      t.name.toLowerCase() === teamIdentifier.toLowerCase() || 
      t.teamId === teamIdentifier
    );

    if (!team) {
      await interaction.editReply({ content: `لم يتم العثور على الفريق: ${teamIdentifier}` });
      return;
    }

    // Update team currency
    const newBalance = (team.currency || 0) + amount;
    await storage.updateTeam(team.id, {
      currency: newBalance,
      updatedAt: new Date()
    });

    // Create transaction record
    const transaction = await storage.createTransaction({
      serverId,
      transactionType: type === 'win' ? 'win_award' : 'loss_award',
      amount,
      status: 'completed',
      sourceTeamId: null,
      targetTeamId: team.id,
      playerId: null,
      reason: type === 'win' 
        ? `${team.name} تم منح جائزة الفوز: ${formatCurrency(amount)}`
        : `${team.name} تم منح تعويض الخسارة: ${formatCurrency(amount)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create and send embed
    const embed = new EmbedBuilder()
      .setColor(type === 'win' ? '#2ecc71' : '#f39c12')
      .setTitle(`${team.emoji} ${team.name} ${type === 'win' ? 'Win' : 'Loss'} Award`)
      .setDescription(`${team.emoji} ${team.name} has been awarded ${formatCurrency(amount)} for a ${type === 'win' ? 'win' : 'loss'}!`)
      .addFields(
        { name: 'New Balance', value: formatCurrency(newBalance) },
        { name: 'Awarded By', value: `<@${interaction.user.id}>` }
      );

    await interaction.editReply({ embeds: [embed] });

    // Notify team coaches
    try {
      const coachAssignments = await storage.getCoachAssignmentsByTeam(team.id);
      const guild = interaction.guild;

      if (guild && coachAssignments.length > 0) {
        for (const assignment of coachAssignments) {
          try {
            const coachMember = await guild.members.fetch(assignment.userId);
            await coachMember.send({ 
              content: `تم منح فريقك ${formatCurrency(amount)} ${type === 'win' ? 'لفوزه بالمباراة!' : 'كتعويض عن الخسارة.'}`,
              embeds: [embed]
            });
          } catch (error) {
            console.error(`Failed to notify coach ${assignment.userId}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error notifying coaches:', error);
    }

  } catch (error) {
    console.error(`Error handling ${type} command:`, error);
    await interaction.editReply({ content: 'حدث خطأ أثناء معالجة الأمر. الرجاء المحاولة مرة أخرى.' });
  }
}

// Balance command - check team's currency balance
const balanceCommand = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check team balance')
    .addStringOption(option => 
      option.setName('team')
        .setDescription('The team ID or name (optional)')
        .setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await handleBalanceCommand(interaction);
  }
};

// Arabic version
const balanceArabicCommand = {
  data: new SlashCommandBuilder()
    .setName('رصيد')
    .setDescription('التحقق من رصيد الفريق')
    .addStringOption(option => 
      option.setName('team')
        .setDescription('رمز الفريق أو اسمه (اختياري)')
        .setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await handleBalanceCommand(interaction);
  }
};

async function handleBalanceCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const serverId = interaction.guildId;
  if (!serverId) {
    await interaction.editReply({ content: 'هذا الأمر يمكن استخدامه فقط في سيرفر!' });
    return;
  }

  try {
    const teamIdentifier = interaction.options.getString('team');

    // If no team specified, try to get the user's team
    if (!teamIdentifier) {
      const coachAssignments = await storage.getCoachAssignmentsByUser(serverId, interaction.user.id);

      if (coachAssignments.length === 0) {
        await interaction.editReply({ content: 'يرجى تحديد فريق أو استخدام هذا الأمر كمدرب.' });
        return;
      }

      const team = await storage.getTeam(coachAssignments[0].teamId);
      if (!team) {
        await interaction.editReply({ content: 'لم يتم العثور على الفريق المرتبط بك.' });
        return;
      }

      const embed = new EmbedBuilder()
        .setColor('#3498db')
        .setTitle(`${team.emoji} ${team.name} Balance`)
        .setDescription(`Current balance: **${formatCurrency(team.currency || 0)}**`);

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // Find team by name or ID
    const teams = await storage.getTeams(serverId);
    const team = teams.find(t => 
      t.name.toLowerCase() === teamIdentifier.toLowerCase() || 
      t.teamId === teamIdentifier
    );

    if (!team) {
      await interaction.editReply({ content: `لم يتم العثور على الفريق: ${teamIdentifier}` });
      return;
    }

    // Check if user is allowed to see this team's balance
    const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);
    const isCoach = (await storage.getCoachAssignmentsByUser(serverId, interaction.user.id))
      .some(a => a.teamId === team.id);

    if (!isAdmin && !isCoach) {
      await interaction.editReply({ 
        content: 'ليس لديك صلاحية لعرض رصيد هذا الفريق. يجب أن تكون مدرباً للفريق أو مسؤولاً.',
        ephemeral: true
      });
      return;
    }

    // Show balance
    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle(`${team.emoji} ${team.name} Balance`)
      .setDescription(`Current balance: **${formatCurrency(team.currency || 0)}**`);

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error('Error handling balance command:', error);
    await interaction.editReply({ content: 'حدث خطأ أثناء معالجة الأمر. الرجاء المحاولة مرة أخرى.' });
  }
}

export const currencyCommands = [
  winCommand,
  winArabicCommand,
  lossCommand,
  lossArabicCommand,
  balanceCommand,
  balanceArabicCommand
];