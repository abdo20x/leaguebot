// Player transfer commands
import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction,
  ButtonInteraction
} from "discord.js";
import { storage } from "../../storage";
import { createTransactionEmbed, createTransactionActionButtons } from "../embeds";
import { detectLanguage, getTranslation } from "../translations";
import { sendDM } from "../utils";

// Transfer request command
const transferRequestCommand = {
  data: new SlashCommandBuilder()
    .setName('transfer')
    .setDescription('Player transfer system')
    .addSubcommand(subcommand =>
      subcommand
        .setName('request')
        .setDescription('Request a player transfer')
        .addUserOption(option => 
          option.setName('player')
            .setDescription('The player to transfer')
            .setRequired(true))
        .addRoleOption(option => 
          option.setName('target_team')
            .setDescription('The team to transfer the player to')
            .setRequired(true))
        .addIntegerOption(option => 
          option.setName('amount')
            .setDescription('The transfer fee (optional)')
            .setRequired(false))
        .addStringOption(option =>
          option.setName('reason')
            .setDescription('Reason for the transfer (optional)')
            .setRequired(false))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('approve')
        .setDescription('Approve a pending transfer')
        .addIntegerOption(option => 
          option.setName('transaction_id')
            .setDescription('The ID of the transaction to approve')
            .setRequired(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('reject')
        .setDescription('Reject a pending transfer')
        .addIntegerOption(option => 
          option.setName('transaction_id')
            .setDescription('The ID of the transaction to reject')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('reason')
            .setDescription('Reason for rejection (optional)')
            .setRequired(false))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List pending transfers')
    ),
  
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
      case 'request':
        await handleTransferRequest(interaction, serverId, locale);
        break;
      case 'approve':
        await handleTransferApprove(interaction, serverId, locale);
        break;
      case 'reject':
        await handleTransferReject(interaction, serverId, locale);
        break;
      case 'list':
        await handleListTransfers(interaction, serverId, locale);
        break;
      default:
        await interaction.reply({ content: 'Unknown subcommand!', ephemeral: true });
    }
  },
  
  // Handle button interactions for transfer approvals/rejections
  async handleButton(interaction: ButtonInteraction): Promise<void> {
    const serverId = interaction.guildId;
    if (!serverId) {
      await interaction.reply({ content: 'This command can only be used in a server!', ephemeral: true });
      return;
    }
    
    // Detect language
    const locale = detectLanguage(interaction.guild?.name || '') || 'en';
    
    // Extract transaction ID from custom ID
    const [action, transactionId] = interaction.customId.split('_').slice(1);
    const tId = parseInt(transactionId);
    
    if (isNaN(tId)) {
      await interaction.reply({ content: 'Invalid transaction ID!', ephemeral: true });
      return;
    }
    
    // Handle based on action
    if (action === 'approve') {
      // Create a mock interaction for the approval handler
      const mockInteraction = {
        ...interaction,
        options: {
          getSubcommand: () => 'approve',
          getInteger: (name: string) => name === 'transaction_id' ? tId : null
        }
      } as unknown as ChatInputCommandInteraction;
      
      await handleTransferApprove(mockInteraction, serverId, locale);
    } else if (action === 'reject') {
      // Create a mock interaction for the rejection handler
      const mockInteraction = {
        ...interaction,
        options: {
          getSubcommand: () => 'reject',
          getInteger: (name: string) => name === 'transaction_id' ? tId : null,
          getString: (name: string) => name === 'reason' ? 'Rejected via button' : null
        }
      } as unknown as ChatInputCommandInteraction;
      
      await handleTransferReject(mockInteraction, serverId, locale);
    }
  }
};

// Arabic version - تحويل command
const transferArabicCommand = {
  data: new SlashCommandBuilder()
    .setName('تحويل')
    .setDescription('نظام تحويل اللاعبين')
    .addSubcommand(subcommand =>
      subcommand
        .setName('طلب')
        .setDescription('طلب تحويل لاعب')
        .addUserOption(option => 
          option.setName('اللاعب')
            .setDescription('اللاعب المراد تحويله')
            .setRequired(true))
        .addRoleOption(option => 
          option.setName('الفريق_الهدف')
            .setDescription('الفريق المراد تحويل اللاعب إليه')
            .setRequired(true))
        .addIntegerOption(option => 
          option.setName('المبلغ')
            .setDescription('رسوم التحويل (اختياري)')
            .setRequired(false))
        .addStringOption(option =>
          option.setName('السبب')
            .setDescription('سبب التحويل (اختياري)')
            .setRequired(false))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('موافقة')
        .setDescription('الموافقة على تحويل معلق')
        .addIntegerOption(option => 
          option.setName('رقم_المعاملة')
            .setDescription('معرف المعاملة المراد الموافقة عليها')
            .setRequired(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('رفض')
        .setDescription('رفض تحويل معلق')
        .addIntegerOption(option => 
          option.setName('رقم_المعاملة')
            .setDescription('معرف المعاملة المراد رفضها')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('السبب')
            .setDescription('سبب الرفض (اختياري)')
            .setRequired(false))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('قائمة')
        .setDescription('عرض التحويلات المعلقة')
    ),
  
  // Execute the Arabic command - map to English handlers
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const serverId = interaction.guildId;
    if (!serverId) {
      await interaction.reply({ content: 'لا يمكن استخدام هذا الأمر إلا في خادم!', ephemeral: true });
      return;
    }
    
    // Always use Arabic for this command
    const locale = 'ar';
    
    // Get subcommand
    const subcommand = interaction.options.getSubcommand();
    
    // Map Arabic subcommands to English handlers
    switch (subcommand) {
      case 'طلب': // request
        const player = interaction.options.getUser('اللاعب');
        const targetTeam = interaction.options.getRole('الفريق_الهدف');
        const amount = interaction.options.getInteger('المبلغ');
        const reason = interaction.options.getString('السبب');
        
        // Create a modified interaction with mapped options
        const requestInteraction = {
          ...interaction,
          options: {
            ...interaction.options,
            getSubcommand: () => 'request',
            getUser: (name: string) => name === 'player' ? player : null,
            getRole: (name: string) => name === 'target_team' ? targetTeam : null,
            getInteger: (name: string) => name === 'amount' ? amount : null,
            getString: (name: string) => name === 'reason' ? reason : null
          }
        } as ChatInputCommandInteraction;
        
        await handleTransferRequest(requestInteraction, serverId, locale);
        break;
        
      case 'موافقة': // approve
        const transactionId = interaction.options.getInteger('رقم_المعاملة');
        
        // Create a modified interaction with mapped options
        const approveInteraction = {
          ...interaction,
          options: {
            ...interaction.options,
            getSubcommand: () => 'approve',
            getInteger: (name: string) => name === 'transaction_id' ? transactionId : null
          }
        } as ChatInputCommandInteraction;
        
        await handleTransferApprove(approveInteraction, serverId, locale);
        break;
        
      case 'رفض': // reject
        const rejectTransactionId = interaction.options.getInteger('رقم_المعاملة');
        const rejectReason = interaction.options.getString('السبب');
        
        // Create a modified interaction with mapped options
        const rejectInteraction = {
          ...interaction,
          options: {
            ...interaction.options,
            getSubcommand: () => 'reject',
            getInteger: (name: string) => name === 'transaction_id' ? rejectTransactionId : null,
            getString: (name: string) => name === 'reason' ? rejectReason : null
          }
        } as ChatInputCommandInteraction;
        
        await handleTransferReject(rejectInteraction, serverId, locale);
        break;
        
      case 'قائمة': // list
        await handleListTransfers(interaction, serverId, locale);
        break;
        
      default:
        await interaction.reply({ content: 'أمر فرعي غير معروف!', ephemeral: true });
    }
  }
};

// Helper function to handle transfer requests
async function handleTransferRequest(
  interaction: ChatInputCommandInteraction,
  serverId: string,
  locale: string
): Promise<void> {
  const player = interaction.options.getUser('player');
  const targetTeamRole = interaction.options.getRole('target_team');
  const amount = interaction.options.getInteger('amount') || 0;
  const reason = interaction.options.getString('reason') || '';
  
  if (!player || !targetTeamRole) {
    await interaction.reply({ content: 'Player and target team are required!', ephemeral: true });
    return;
  }
  
  // Get the player from storage
  const playerRecord = await storage.getPlayerByUserId(serverId, player.id);
  
  if (!playerRecord) {
    await interaction.reply({ 
      content: `${player.username} is not in any team roster. Add them first with /roster add.`,
      ephemeral: true
    });
    return;
  }
  
  // Get the player's current team
  const sourceTeam = await storage.getTeam(playerRecord.teamId || 0);
  
  if (!sourceTeam) {
    await interaction.reply({ 
      content: 'Error: Player is on an invalid team.',
      ephemeral: true
    });
    return;
  }
  
  // Get the target team
  const targetTeam = await storage.getTeamByRoleId(serverId, targetTeamRole.id);
  
  if (!targetTeam) {
    await interaction.reply({ 
      content: 'Target team not found! Make sure you selected a valid team role.',
      ephemeral: true
    });
    return;
  }
  
  // Don't allow transfers to the same team
  if (sourceTeam.id === targetTeam.id) {
    await interaction.reply({ 
      content: `${player.username} is already on team ${targetTeam.emoji} ${targetTeam.name}.`,
      ephemeral: true
    });
    return;
  }
  
  // Check if target team has room
  const targetTeamPlayers = await storage.getPlayersByTeam(targetTeam.id);
  
  if (targetTeamPlayers.length >= (targetTeam.rosterMax || 22)) {
    await interaction.reply({ 
      content: `Team ${targetTeam.emoji} ${targetTeam.name} is at maximum roster capacity (${targetTeam.rosterMax || 22}).`,
      ephemeral: true
    });
    return;
  }
  
  // If there's a transfer fee, check if the target team has enough currency
  if (amount > 0) {
    if ((targetTeam.currency || 0) < amount) {
      await interaction.reply({ 
        content: `Team ${targetTeam.emoji} ${targetTeam.name} does not have enough currency for this transfer (${amount.toLocaleString()} required).`,
        ephemeral: true
      });
      return;
    }
  }
  
  // Create the transfer transaction
  const transaction = await storage.createTransaction({
    serverId,
    transactionType: 'transfer',
    sourceTeamId: sourceTeam.id,
    targetTeamId: targetTeam.id,
    playerId: playerRecord.id,
    amount,
    status: 'pending',
    reason
  });
  
  // Create embed for the transaction
  const embed = await createTransactionEmbed({
    ...transaction,
    sourceTeam,
    targetTeam,
    player: playerRecord
  }, locale);
  
  // Create action buttons
  const actionRow = createTransactionActionButtons(transaction.id, locale);
  
  // Notify team captains about the transfer request
  // For source team, find captains (coach with ID 1)
  const sourceCaptainAssignments = await storage.getCoachAssignmentsByTeam(sourceTeam.id);
  const sourceCaptains = sourceCaptainAssignments.filter(a => a.coachId === 1); // Assuming 1 is for captains
  
  // Send DMs to source team captains
  for (const captain of sourceCaptains) {
    try {
      const user = await interaction.client.users.fetch(captain.userId);
      if (user) {
        await sendDM(user, {
          content: `A transfer request has been made for ${player.username} from your team ${sourceTeam.emoji} ${sourceTeam.name} to ${targetTeam.emoji} ${targetTeam.name}.`,
          embeds: [embed],
          components: [actionRow]
        });
      }
    } catch (error) {
      console.error(`Error sending DM to captain ${captain.userId}:`, error);
    }
  }
  
  // Reply with the transaction details
  await interaction.reply({ 
    content: getTranslation('transaction_created', locale as any),
    embeds: [embed],
    components: [actionRow],
    ephemeral: false
  });
}

// Helper function to handle approving a transfer
async function handleTransferApprove(
  interaction: ChatInputCommandInteraction,
  serverId: string,
  locale: string
): Promise<void> {
  const transactionId = interaction.options.getInteger('transaction_id');
  
  if (!transactionId) {
    await interaction.reply({ content: 'Transaction ID is required!', ephemeral: true });
    return;
  }
  
  // Get the transaction
  const transaction = await storage.getTransaction(transactionId);
  
  if (!transaction || transaction.serverId !== serverId) {
    await interaction.reply({ 
      content: `Transaction #${transactionId} not found.`,
      ephemeral: true
    });
    return;
  }
  
  // Check if transaction is already approved or rejected
  if (transaction.status !== 'pending') {
    await interaction.reply({ 
      content: `Transaction #${transactionId} is already ${transaction.status}.`,
      ephemeral: true
    });
    return;
  }
  
  // Check if user has permission to approve this transaction
  // Only captains of the source team or managers/admins can approve
  const isAdmin = interaction.memberPermissions?.has('Administrator') || false;
  const isManager = interaction.memberPermissions?.has('ManageRoles') || false;
  
  if (!isAdmin && !isManager) {
    // Check if user is a captain of the source team
    const sourceTeamId = transaction.sourceTeamId || 0;
    const userCoachAssignments = await storage.getCoachAssignmentsByUser(serverId, interaction.user.id);
    const isCaptain = userCoachAssignments.some(a => 
      a.teamId === sourceTeamId && a.coachId === 1 // Assuming 1 is for captains
    );
    
    if (!isCaptain) {
      await interaction.reply({ 
        content: `You don't have permission to approve this transfer. Only captains of the source team or managers/admins can approve.`,
        ephemeral: true
      });
      return;
    }
  }
  
  // Get the player
  const player = await storage.getPlayer(transaction.playerId || 0);
  
  if (!player) {
    await interaction.reply({ 
      content: `Error: Player not found for this transaction.`,
      ephemeral: true
    });
    return;
  }
  
  // Get the source and target teams
  const sourceTeam = await storage.getTeam(transaction.sourceTeamId || 0);
  const targetTeam = await storage.getTeam(transaction.targetTeamId || 0);
  
  if (!sourceTeam || !targetTeam) {
    await interaction.reply({ 
      content: `Error: Source or target team not found for this transaction.`,
      ephemeral: true
    });
    return;
  }
  
  // Check if target team still has room
  const targetTeamPlayers = await storage.getPlayersByTeam(targetTeam.id);
  
  if (targetTeamPlayers.length >= (targetTeam.rosterMax || 22)) {
    await interaction.reply({ 
      content: `Team ${targetTeam.emoji} ${targetTeam.name} is now at maximum roster capacity (${targetTeam.rosterMax || 22}). Transfer cannot be completed.`,
      ephemeral: true
    });
    return;
  }
  
  // If there's a transfer fee, check if the target team still has enough currency
  if (transaction.amount > 0) {
    if ((targetTeam.currency || 0) < transaction.amount) {
      await interaction.reply({ 
        content: `Team ${targetTeam.emoji} ${targetTeam.name} no longer has enough currency for this transfer (${transaction.amount.toLocaleString()} required).`,
        ephemeral: true
      });
      return;
    }
    
    // Deduct from target team
    await storage.updateTeam(targetTeam.id, {
      currency: (targetTeam.currency || 0) - transaction.amount
    });
    
    // Add to source team
    await storage.updateTeam(sourceTeam.id, {
      currency: (sourceTeam.currency || 0) + transaction.amount
    });
  }
  
  // Move player to target team
  await storage.updatePlayer(player.id, {
    teamId: targetTeam.id
  });
  
  // Update roster counts
  const sourcePlayers = await storage.getPlayersByTeam(sourceTeam.id);
  await storage.updateTeam(sourceTeam.id, {
    rosterCount: sourcePlayers.length
  });
  
  const newTargetPlayers = await storage.getPlayersByTeam(targetTeam.id);
  await storage.updateTeam(targetTeam.id, {
    rosterCount: newTargetPlayers.length
  });
  
  // Update transaction status
  await storage.updateTransaction(transaction.id, {
    status: 'approved',
    approvedBy: interaction.user.id
  });
  
  // Try to update the player's roles in Discord
  try {
    const member = interaction.guild?.members.cache.get(player.userId);
    if (member) {
      // Remove source team role
      const sourceRole = interaction.guild?.roles.cache.get(sourceTeam.roleId);
      if (sourceRole) {
        await member.roles.remove(sourceRole);
      }
      
      // Add target team role
      const targetRole = interaction.guild?.roles.cache.get(targetTeam.roleId);
      if (targetRole) {
        await member.roles.add(targetRole);
      }
    }
  } catch (error) {
    console.error('Error updating roles:', error);
    // Continue anyway, this is not critical
  }
  
  // Notify the player
  try {
    const user = await interaction.client.users.fetch(player.userId);
    if (user) {
      await sendDM(user, {
        content: `Your transfer from ${sourceTeam.emoji} ${sourceTeam.name} to ${targetTeam.emoji} ${targetTeam.name} has been approved.`
      });
    }
  } catch (error) {
    console.error(`Error sending DM to player ${player.userId}:`, error);
  }
  
  // Create embed for the approved transaction
  const embed = await createTransactionEmbed({
    ...transaction,
    status: 'approved',
    approvedBy: interaction.user.id,
    sourceTeam,
    targetTeam,
    player
  }, locale);
  
  // Reply with the transaction details
  await interaction.reply({ 
    content: getTranslation('transaction_approved', locale as any),
    embeds: [embed],
    ephemeral: false
  });
}

// Helper function to handle rejecting a transfer
async function handleTransferReject(
  interaction: ChatInputCommandInteraction,
  serverId: string,
  locale: string
): Promise<void> {
  const transactionId = interaction.options.getInteger('transaction_id');
  const rejectReason = interaction.options.getString('reason') || 'No reason provided';
  
  if (!transactionId) {
    await interaction.reply({ content: 'Transaction ID is required!', ephemeral: true });
    return;
  }
  
  // Get the transaction
  const transaction = await storage.getTransaction(transactionId);
  
  if (!transaction || transaction.serverId !== serverId) {
    await interaction.reply({ 
      content: `Transaction #${transactionId} not found.`,
      ephemeral: true
    });
    return;
  }
  
  // Check if transaction is already approved or rejected
  if (transaction.status !== 'pending') {
    await interaction.reply({ 
      content: `Transaction #${transactionId} is already ${transaction.status}.`,
      ephemeral: true
    });
    return;
  }
  
  // Check if user has permission to reject this transaction
  // Only captains of the source team or managers/admins can reject
  const isAdmin = interaction.memberPermissions?.has('Administrator') || false;
  const isManager = interaction.memberPermissions?.has('ManageRoles') || false;
  
  if (!isAdmin && !isManager) {
    // Check if user is a captain of the source team
    const sourceTeamId = transaction.sourceTeamId || 0;
    const userCoachAssignments = await storage.getCoachAssignmentsByUser(serverId, interaction.user.id);
    const isCaptain = userCoachAssignments.some(a => 
      a.teamId === sourceTeamId && a.coachId === 1 // Assuming 1 is for captains
    );
    
    if (!isCaptain) {
      await interaction.reply({ 
        content: `You don't have permission to reject this transfer. Only captains of the source team or managers/admins can reject.`,
        ephemeral: true
      });
      return;
    }
  }
  
  // Get the player
  const player = await storage.getPlayer(transaction.playerId || 0);
  
  if (!player) {
    await interaction.reply({ 
      content: `Error: Player not found for this transaction.`,
      ephemeral: true
    });
    return;
  }
  
  // Get the source and target teams
  const sourceTeam = await storage.getTeam(transaction.sourceTeamId || 0);
  const targetTeam = await storage.getTeam(transaction.targetTeamId || 0);
  
  if (!sourceTeam || !targetTeam) {
    await interaction.reply({ 
      content: `Error: Source or target team not found for this transaction.`,
      ephemeral: true
    });
    return;
  }
  
  // Update transaction status
  await storage.updateTransaction(transaction.id, {
    status: 'rejected',
    approvedBy: interaction.user.id,
    reason: rejectReason
  });
  
  // Notify the player
  try {
    const user = await interaction.client.users.fetch(player.userId);
    if (user) {
      await sendDM(user, {
        content: `Your transfer from ${sourceTeam.emoji} ${sourceTeam.name} to ${targetTeam.emoji} ${targetTeam.name} has been rejected.\nReason: ${rejectReason}`
      });
    }
  } catch (error) {
    console.error(`Error sending DM to player ${player.userId}:`, error);
  }
  
  // Create embed for the rejected transaction
  const embed = await createTransactionEmbed({
    ...transaction,
    status: 'rejected',
    approvedBy: interaction.user.id,
    reason: rejectReason,
    sourceTeam,
    targetTeam,
    player
  }, locale);
  
  // Reply with the transaction details
  await interaction.reply({ 
    content: getTranslation('transaction_rejected', locale as any),
    embeds: [embed],
    ephemeral: false
  });
}

// Helper function to handle listing pending transfers
async function handleListTransfers(
  interaction: ChatInputCommandInteraction,
  serverId: string,
  locale: string
): Promise<void> {
  // Get pending transactions
  const pendingTransactions = await storage.getPendingTransactions(serverId);
  
  if (pendingTransactions.length === 0) {
    await interaction.reply({ 
      content: 'There are no pending transfers.',
      ephemeral: true
    });
    return;
  }
  
  // Create embeds for each transaction
  const embeds = await Promise.all(pendingTransactions.map(async (transaction) => {
    const player = await storage.getPlayer(transaction.playerId || 0);
    const sourceTeam = await storage.getTeam(transaction.sourceTeamId || 0);
    const targetTeam = await storage.getTeam(transaction.targetTeamId || 0);
    
    return createTransactionEmbed({
      ...transaction,
      sourceTeam,
      targetTeam,
      player
    }, locale);
  }));
  
  // Create action buttons for each transaction
  const components = pendingTransactions.map(transaction => 
    createTransactionActionButtons(transaction.id, locale)
  );
  
  // If too many transactions, limit how many we show
  let content = 'Pending transfers:';
  if (embeds.length > 10) {
    content = `Showing 10/${embeds.length} pending transfers:`;
    embeds.length = 10;
    components.length = 10;
  }
  
  // Reply with the transactions
  await interaction.reply({ 
    content,
    embeds,
    components,
    ephemeral: false
  });
}

// Export all transfer-related commands
export const transferCommands = [
  transferRequestCommand,
  transferArabicCommand
];
