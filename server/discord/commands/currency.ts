// Currency management commands
import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction
} from "discord.js";
import { storage } from "../../storage";
import { createBaseEmbed } from "../embeds";
import { detectLanguage, getTranslation } from "../translations";
import { formatCurrency } from "../utils";

// Currency command
const currencyCommand = {
  data: new SlashCommandBuilder()
    .setName('currency')
    .setDescription('Manage team currency')
    .addSubcommand(subcommand =>
      subcommand
        .setName('award')
        .setDescription('Award currency to a team')
        .addRoleOption(option => 
          option.setName('team')
            .setDescription('The team to award currency to')
            .setRequired(true))
        .addIntegerOption(option => 
          option.setName('amount')
            .setDescription('The amount to award')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('reason')
            .setDescription('Reason for awarding currency (optional)')
            .setRequired(false))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('deduct')
        .setDescription('Deduct currency from a team')
        .addRoleOption(option => 
          option.setName('team')
            .setDescription('The team to deduct currency from')
            .setRequired(true))
        .addIntegerOption(option => 
          option.setName('amount')
            .setDescription('The amount to deduct')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('reason')
            .setDescription('Reason for deducting currency (optional)')
            .setRequired(false))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('set')
        .setDescription('Set a team\'s currency to a specific amount')
        .addRoleOption(option => 
          option.setName('team')
            .setDescription('The team to set currency for')
            .setRequired(true))
        .addIntegerOption(option => 
          option.setName('amount')
            .setDescription('The amount to set')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('reason')
            .setDescription('Reason for setting currency (optional)')
            .setRequired(false))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View a team\'s currency')
        .addRoleOption(option => 
          option.setName('team')
            .setDescription('The team to view currency for')
            .setRequired(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('award_win')
        .setDescription('Award win bonus to a team')
        .addRoleOption(option => 
          option.setName('team')
            .setDescription('The winning team')
            .setRequired(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('award_loss')
        .setDescription('Award loss compensation to a team')
        .addRoleOption(option => 
          option.setName('team')
            .setDescription('The losing team')
            .setRequired(true))
    ),
  
  // Permission check for currency management
  async permissionCheck(interaction: ChatInputCommandInteraction): Promise<boolean> {
    // For viewing, anyone can view currency
    if (interaction.options.getSubcommand() === 'view') {
      return true;
    }
    
    // For other operations, need special permissions
    return interaction.memberPermissions?.has('ManageRoles') || 
           interaction.memberPermissions?.has('Administrator') || 
           false;
  },
  
  // Execute the command
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const serverId = interaction.guildId;
    if (!serverId) {
      await interaction.reply({ content: 'This command can only be used in a server!', ephemeral: true });
      return;
    }
    
    // Detect language
    const locale = detectLanguage(interaction.guild?.name || '') || 'en';
    
    // Get subcommand
    const subcommand = interaction.options.getSubcommand();
    
    // Handle different subcommands
    switch (subcommand) {
      case 'award':
        await handleAwardCurrency(interaction, serverId, locale);
        break;
      case 'deduct':
        await handleDeductCurrency(interaction, serverId, locale);
        break;
      case 'set':
        await handleSetCurrency(interaction, serverId, locale);
        break;
      case 'view':
        await handleViewCurrency(interaction, serverId, locale);
        break;
      case 'award_win':
        await handleAwardWin(interaction, serverId, locale);
        break;
      case 'award_loss':
        await handleAwardLoss(interaction, serverId, locale);
        break;
      default:
        await interaction.reply({ content: 'Unknown subcommand!', ephemeral: true });
    }
  }
};

// Arabic version - عملة command
const currencyArabicCommand = {
  data: new SlashCommandBuilder()
    .setName('عملة')
    .setDescription('إدارة عملة الفريق')
    .addSubcommand(subcommand =>
      subcommand
        .setName('منح')
        .setDescription('منح عملة لفريق')
        .addRoleOption(option => 
          option.setName('الفريق')
            .setDescription('الفريق المراد منحه عملة')
            .setRequired(true))
        .addIntegerOption(option => 
          option.setName('المبلغ')
            .setDescription('المبلغ المراد منحه')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('السبب')
            .setDescription('سبب منح العملة (اختياري)')
            .setRequired(false))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('خصم')
        .setDescription('خصم عملة من فريق')
        .addRoleOption(option => 
          option.setName('الفريق')
            .setDescription('الفريق المراد خصم العملة منه')
            .setRequired(true))
        .addIntegerOption(option => 
          option.setName('المبلغ')
            .setDescription('المبلغ المراد خصمه')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('السبب')
            .setDescription('سبب خصم العملة (اختياري)')
            .setRequired(false))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('تعيين')
        .setDescription('تعيين عملة فريق إلى مبلغ محدد')
        .addRoleOption(option => 
          option.setName('الفريق')
            .setDescription('الفريق المراد تعيين العملة له')
            .setRequired(true))
        .addIntegerOption(option => 
          option.setName('المبلغ')
            .setDescription('المبلغ المراد تعيينه')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('السبب')
            .setDescription('سبب تعيين العملة (اختياري)')
            .setRequired(false))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('عرض')
        .setDescription('عرض عملة فريق')
        .addRoleOption(option => 
          option.setName('الفريق')
            .setDescription('الفريق المراد عرض عملته')
            .setRequired(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('مكافأة_فوز')
        .setDescription('منح مكافأة الفوز لفريق')
        .addRoleOption(option => 
          option.setName('الفريق')
            .setDescription('الفريق الفائز')
            .setRequired(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('تعويض_خسارة')
        .setDescription('منح تعويض الخسارة لفريق')
        .addRoleOption(option => 
          option.setName('الفريق')
            .setDescription('الفريق الخاسر')
            .setRequired(true))
    ),
  
  // Same permission check as English version
  async permissionCheck(interaction: ChatInputCommandInteraction): Promise<boolean> {
    // For viewing, anyone can view currency
    if (interaction.options.getSubcommand() === 'عرض') {
      return true;
    }
    
    // For other operations, need special permissions
    return interaction.memberPermissions?.has('ManageRoles') || 
           interaction.memberPermissions?.has('Administrator') || 
           false;
  },
  
  // Execute command - map Arabic subcommands to English handlers
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const serverId = interaction.guildId;
    if (!serverId) {
      await interaction.reply({ content: 'لا يمكن استخدام هذا الأمر إلا في خادم!', ephemeral: true });
      return;
    }
    
    // Always use Arabic for this command
    const locale = 'ar';
    
    // Get subcommand and map options
    const subcommand = interaction.options.getSubcommand();
    
    switch (subcommand) {
      case 'منح': // award
        const awardTeam = interaction.options.getRole('الفريق');
        const awardAmount = interaction.options.getInteger('المبلغ');
        const awardReason = interaction.options.getString('السبب');
        
        // Create modified interaction with mapped options
        const awardInteraction = {
          ...interaction,
          options: {
            ...interaction.options,
            getSubcommand: () => 'award',
            getRole: (name: string) => name === 'team' ? awardTeam : null,
            getInteger: (name: string) => name === 'amount' ? awardAmount : null,
            getString: (name: string) => name === 'reason' ? awardReason : null
          }
        } as ChatInputCommandInteraction;
        
        await handleAwardCurrency(awardInteraction, serverId, locale);
        break;
        
      case 'خصم': // deduct
        const deductTeam = interaction.options.getRole('الفريق');
        const deductAmount = interaction.options.getInteger('المبلغ');
        const deductReason = interaction.options.getString('السبب');
        
        // Create modified interaction with mapped options
        const deductInteraction = {
          ...interaction,
          options: {
            ...interaction.options,
            getSubcommand: () => 'deduct',
            getRole: (name: string) => name === 'team' ? deductTeam : null,
            getInteger: (name: string) => name === 'amount' ? deductAmount : null,
            getString: (name: string) => name === 'reason' ? deductReason : null
          }
        } as ChatInputCommandInteraction;
        
        await handleDeductCurrency(deductInteraction, serverId, locale);
        break;
        
      case 'تعيين': // set
        const setTeam = interaction.options.getRole('الفريق');
        const setAmount = interaction.options.getInteger('المبلغ');
        const setReason = interaction.options.getString('السبب');
        
        // Create modified interaction with mapped options
        const setInteraction = {
          ...interaction,
          options: {
            ...interaction.options,
            getSubcommand: () => 'set',
            getRole: (name: string) => name === 'team' ? setTeam : null,
            getInteger: (name: string) => name === 'amount' ? setAmount : null,
            getString: (name: string) => name === 'reason' ? setReason : null
          }
        } as ChatInputCommandInteraction;
        
        await handleSetCurrency(setInteraction, serverId, locale);
        break;
        
      case 'عرض': // view
        const viewTeam = interaction.options.getRole('الفريق');
        
        // Create modified interaction with mapped options
        const viewInteraction = {
          ...interaction,
          options: {
            ...interaction.options,
            getSubcommand: () => 'view',
            getRole: (name: string) => name === 'team' ? viewTeam : null
          }
        } as ChatInputCommandInteraction;
        
        await handleViewCurrency(viewInteraction, serverId, locale);
        break;
        
      case 'مكافأة_فوز': // award_win
        const winTeam = interaction.options.getRole('الفريق');
        
        // Create modified interaction with mapped options
        const winInteraction = {
          ...interaction,
          options: {
            ...interaction.options,
            getSubcommand: () => 'award_win',
            getRole: (name: string) => name === 'team' ? winTeam : null
          }
        } as ChatInputCommandInteraction;
        
        await handleAwardWin(winInteraction, serverId, locale);
        break;
        
      case 'تعويض_خسارة': // award_loss
        const lossTeam = interaction.options.getRole('الفريق');
        
        // Create modified interaction with mapped options
        const lossInteraction = {
          ...interaction,
          options: {
            ...interaction.options,
            getSubcommand: () => 'award_loss',
            getRole: (name: string) => name === 'team' ? lossTeam : null
          }
        } as ChatInputCommandInteraction;
        
        await handleAwardLoss(lossInteraction, serverId, locale);
        break;
        
      default:
        await interaction.reply({ content: 'أمر فرعي غير معروف!', ephemeral: true });
    }
  }
};

// Helper function to handle awarding currency
async function handleAwardCurrency(
  interaction: ChatInputCommandInteraction,
  serverId: string,
  locale: string
): Promise<void> {
  const teamRole = interaction.options.getRole('team');
  const amount = interaction.options.getInteger('amount');
  const reason = interaction.options.getString('reason') || 'Manual award';
  
  if (!teamRole || !amount) {
    await interaction.reply({ content: 'Team and amount are required!', ephemeral: true });
    return;
  }
  
  if (amount <= 0) {
    await interaction.reply({ content: 'Amount must be positive!', ephemeral: true });
    return;
  }
  
  // Find the team
  const team = await storage.getTeamByRoleId(serverId, teamRole.id);
  
  if (!team) {
    await interaction.reply({ 
      content: 'Team not found! Make sure you selected a valid team role.',
      ephemeral: true
    });
    return;
  }
  
  // Update team currency
  const updatedTeam = await storage.updateTeam(team.id, {
    currency: (team.currency || 0) + amount
  });
  
  // Create a currency transaction record
  await storage.createTransaction({
    serverId,
    transactionType: 'currency',
    targetTeamId: team.id,
    amount,
    status: 'approved',
    approvedBy: interaction.user.id,
    reason
  });
  
  // Create embed
  const embed = createBaseEmbed(locale)
    .setTitle('Currency Award')
    .setDescription(`${team.emoji} ${team.name} has been awarded ${formatCurrency(amount)} coins.`)
    .addFields(
      { name: 'New Balance', value: formatCurrency(updatedTeam?.currency || 0) },
      { name: 'Reason', value: reason }
    );
  
  await interaction.reply({ 
    embeds: [embed],
    ephemeral: false
  });
}

// Helper function to handle deducting currency
async function handleDeductCurrency(
  interaction: ChatInputCommandInteraction,
  serverId: string,
  locale: string
): Promise<void> {
  const teamRole = interaction.options.getRole('team');
  const amount = interaction.options.getInteger('amount');
  const reason = interaction.options.getString('reason') || 'Manual deduction';
  
  if (!teamRole || !amount) {
    await interaction.reply({ content: 'Team and amount are required!', ephemeral: true });
    return;
  }
  
  if (amount <= 0) {
    await interaction.reply({ content: 'Amount must be positive!', ephemeral: true });
    return;
  }
  
  // Find the team
  const team = await storage.getTeamByRoleId(serverId, teamRole.id);
  
  if (!team) {
    await interaction.reply({ 
      content: 'Team not found! Make sure you selected a valid team role.',
      ephemeral: true
    });
    return;
  }
  
  // Check if team has enough currency
  if ((team.currency || 0) < amount) {
    await interaction.reply({ 
      content: `Team ${team.emoji} ${team.name} does not have enough currency (${formatCurrency(team.currency || 0)} available, ${formatCurrency(amount)} required).`,
      ephemeral: true
    });
    return;
  }
  
  // Update team currency
  const updatedTeam = await storage.updateTeam(team.id, {
    currency: (team.currency || 0) - amount
  });
  
  // Create a currency transaction record
  await storage.createTransaction({
    serverId,
    transactionType: 'currency',
    targetTeamId: team.id,
    amount: -amount,
    status: 'approved',
    approvedBy: interaction.user.id,
    reason
  });
  
  // Create embed
  const embed = createBaseEmbed(locale)
    .setTitle('Currency Deduction')
    .setDescription(`${amount.toLocaleString()} coins have been deducted from ${team.emoji} ${team.name}.`)
    .addFields(
      { name: 'New Balance', value: formatCurrency(updatedTeam?.currency || 0) },
      { name: 'Reason', value: reason }
    );
  
  await interaction.reply({ 
    embeds: [embed],
    ephemeral: false
  });
}

// Helper function to handle setting currency
async function handleSetCurrency(
  interaction: ChatInputCommandInteraction,
  serverId: string,
  locale: string
): Promise<void> {
  const teamRole = interaction.options.getRole('team');
  const amount = interaction.options.getInteger('amount');
  const reason = interaction.options.getString('reason') || 'Manual set';
  
  if (!teamRole || amount === null || amount === undefined) {
    await interaction.reply({ content: 'Team and amount are required!', ephemeral: true });
    return;
  }
  
  if (amount < 0) {
    await interaction.reply({ content: 'Amount cannot be negative!', ephemeral: true });
    return;
  }
  
  // Find the team
  const team = await storage.getTeamByRoleId(serverId, teamRole.id);
  
  if (!team) {
    await interaction.reply({ 
      content: 'Team not found! Make sure you selected a valid team role.',
      ephemeral: true
    });
    return;
  }
  
  // Calculate difference for transaction record
  const difference = amount - (team.currency || 0);
  
  // Update team currency
  const updatedTeam = await storage.updateTeam(team.id, {
    currency: amount
  });
  
  // Create a currency transaction record
  await storage.createTransaction({
    serverId,
    transactionType: 'currency',
    targetTeamId: team.id,
    amount: difference,
    status: 'approved',
    approvedBy: interaction.user.id,
    reason
  });
  
  // Create embed
  const embed = createBaseEmbed(locale)
    .setTitle('Currency Set')
    .setDescription(`${team.emoji} ${team.name}'s currency has been set to ${formatCurrency(amount)} coins.`)
    .addFields(
      { name: 'Previous Balance', value: formatCurrency(team.currency || 0) },
      { name: 'Change', value: formatCurrency(difference) },
      { name: 'Reason', value: reason }
    );
  
  await interaction.reply({ 
    embeds: [embed],
    ephemeral: false
  });
}

// Helper function to handle viewing currency
async function handleViewCurrency(
  interaction: ChatInputCommandInteraction,
  serverId: string,
  locale: string
): Promise<void> {
  const teamRole = interaction.options.getRole('team');
  
  if (!teamRole) {
    await interaction.reply({ content: 'Team is required!', ephemeral: true });
    return;
  }
  
  // Find the team
  const team = await storage.getTeamByRoleId(serverId, teamRole.id);
  
  if (!team) {
    await interaction.reply({ 
      content: 'Team not found! Make sure you selected a valid team role.',
      ephemeral: true
    });
    return;
  }
  
  // Get recent transactions
  const transactions = await storage.getTransactionsByTeam(team.id);
  const recentTransactions = transactions
    .filter(t => t.status === 'approved')
    .slice(0, 5); // Show only 5 most recent
  
  // Format recent transactions
  const transactionsText = recentTransactions.length > 0
    ? recentTransactions.map(t => {
        const amountText = t.amount > 0 
          ? `+${formatCurrency(t.amount)}` 
          : formatCurrency(t.amount);
        return `${amountText} - ${t.reason || 'No reason'} (<t:${Math.floor(t.createdAt.getTime() / 1000)}:R>)`;
      }).join('\n')
    : 'No recent transactions';
  
  // Create embed
  const embed = createBaseEmbed(locale)
    .setTitle(`${team.emoji} ${team.name} - Currency`)
    .setDescription(`Current balance: **${formatCurrency(team.currency || 0)}** coins`)
    .addFields({ name: 'Recent Transactions', value: transactionsText });
  
  await interaction.reply({ 
    embeds: [embed],
    ephemeral: false
  });
}

// Helper function to handle awarding win currency
async function handleAwardWin(
  interaction: ChatInputCommandInteraction,
  serverId: string,
  locale: string
): Promise<void> {
  const teamRole = interaction.options.getRole('team');
  
  if (!teamRole) {
    await interaction.reply({ content: 'Team is required!', ephemeral: true });
    return;
  }
  
  // Find the team
  const team = await storage.getTeamByRoleId(serverId, teamRole.id);
  
  if (!team) {
    await interaction.reply({ 
      content: 'Team not found! Make sure you selected a valid team role.',
      ephemeral: true
    });
    return;
  }
  
  // Get server settings
  const settings = await storage.getSettings(serverId);
  
  if (!settings) {
    await interaction.reply({ 
      content: 'Server settings not found! Please run /setup first.',
      ephemeral: true
    });
    return;
  }
  
  // Get win amount
  const winAmount = settings.winCurrency || 10000000; // Default to 10M
  
  // Update team currency
  const updatedTeam = await storage.updateTeam(team.id, {
    currency: (team.currency || 0) + winAmount
  });
  
  // Create a currency transaction record
  await storage.createTransaction({
    serverId,
    transactionType: 'currency',
    targetTeamId: team.id,
    amount: winAmount,
    status: 'approved',
    approvedBy: interaction.user.id,
    reason: 'Win bonus'
  });
  
  // Create embed
  const embed = createBaseEmbed(locale)
    .setTitle('Win Bonus')
    .setDescription(`${team.emoji} ${team.name} has been awarded ${formatCurrency(winAmount)} coins for winning!`)
    .addFields({ name: 'New Balance', value: formatCurrency(updatedTeam?.currency || 0) });
  
  await interaction.reply({ 
    embeds: [embed],
    ephemeral: false
  });
}

// Helper function to handle awarding loss currency
async function handleAwardLoss(
  interaction: ChatInputCommandInteraction,
  serverId: string,
  locale: string
): Promise<void> {
  const teamRole = interaction.options.getRole('team');
  
  if (!teamRole) {
    await interaction.reply({ content: 'Team is required!', ephemeral: true });
    return;
  }
  
  // Find the team
  const team = await storage.getTeamByRoleId(serverId, teamRole.id);
  
  if (!team) {
    await interaction.reply({ 
      content: 'Team not found! Make sure you selected a valid team role.',
      ephemeral: true
    });
    return;
  }
  
  // Get server settings
  const settings = await storage.getSettings(serverId);
  
  if (!settings) {
    await interaction.reply({ 
      content: 'Server settings not found! Please run /setup first.',
      ephemeral: true
    });
    return;
  }
  
  // Get loss amount
  const lossAmount = settings.lossCurrency || 5000000; // Default to 5M
  
  // Update team currency
  const updatedTeam = await storage.updateTeam(team.id, {
    currency: (team.currency || 0) + lossAmount
  });
  
  // Create a currency transaction record
  await storage.createTransaction({
    serverId,
    transactionType: 'currency',
    targetTeamId: team.id,
    amount: lossAmount,
    status: 'approved',
    approvedBy: interaction.user.id,
    reason: 'Loss compensation'
  });
  
  // Create embed
  const embed = createBaseEmbed(locale)
    .setTitle('Loss Compensation')
    .setDescription(`${team.emoji} ${team.name} has been awarded ${formatCurrency(lossAmount)} coins for participating.`)
    .addFields({ name: 'New Balance', value: formatCurrency(updatedTeam?.currency || 0) });
  
  await interaction.reply({ 
    embeds: [embed],
    ephemeral: false
  });
}

// Export all currency-related commands
export const currencyCommands = [
  currencyCommand,
  currencyArabicCommand
];
