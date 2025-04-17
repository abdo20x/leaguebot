import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  User as DiscordUser
} from "discord.js";
import { storage } from "../../storage";
import { createTransactionEmbed } from "../embeds";
import { formatCurrency } from "../utils";

// Sign player command
const signCommand = {
  data: new SlashCommandBuilder()
    .setName('sign')
    .setDescription('Sign a player to your team')
    .addUserOption(option => 
      option.setName('player')
        .setDescription('The player to sign')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await handleSignCommand(interaction);
  }
};

// Arabic version - توقيع command
const signArabicCommand = {
  data: new SlashCommandBuilder()
    .setName('توقيع')
    .setDescription('توقيع لاعب في فريقك')
    .addUserOption(option => 
      option.setName('player')
        .setDescription('اللاعب المراد توقيعه')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await handleSignCommand(interaction);
  }
};

// Release player command
const releaseCommand = {
  data: new SlashCommandBuilder()
    .setName('release')
    .setDescription('Release a player from your team')
    .addUserOption(option => 
      option.setName('player')
        .setDescription('The player to release')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await handleReleaseCommand(interaction);
  }
};

// Arabic version - اطلاق command
const releaseArabicCommand = {
  data: new SlashCommandBuilder()
    .setName('اطلاق')
    .setDescription('إطلاق لاعب من فريقك')
    .addUserOption(option => 
      option.setName('player')
        .setDescription('اللاعب المراد إطلاقه')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await handleReleaseCommand(interaction);
  }
};

// Handle sign command
async function handleSignCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  
  const serverId = interaction.guildId;
  if (!serverId) {
    await interaction.editReply({ content: 'هذا الأمر يمكن استخدامه فقط في سيرفر!' });
    return;
  }
  
  try {
    // Get the player user
    const user = interaction.options.getUser('player');
    if (!user) {
      await interaction.editReply({ content: 'يجب تحديد لاعب للتوقيع.' });
      return;
    }
    
    // Check if the user is a coach
    const member = interaction.member;
    if (!member || !('roles' in member)) {
      await interaction.editReply({ content: 'فشل في التحقق من صلاحياتك.' });
      return;
    }
    
    // Get coach role IDs for this member
    const memberRoles = Array.isArray(member.roles) 
      ? member.roles 
      : member.roles.cache.map(role => role.id);
    
    // Find all coach assignments for this member
    const coachAssignments = await storage.getCoachAssignmentsByUser(serverId, interaction.user.id);
    if (coachAssignments.length === 0) {
      await interaction.editReply({ content: 'يجب أن تكون مدرباً لفريق لاستخدام هذا الأمر.' });
      return;
    }
    
    // Get the team for the first coach assignment
    const teamId = coachAssignments[0].teamId;
    const team = await storage.getTeam(teamId);
    
    if (!team) {
      await interaction.editReply({ content: 'لم يتم العثور على الفريق المرتبط بك.' });
      return;
    }
    
    // Check if player is already on a team
    const existingPlayer = await storage.getPlayerByUserId(serverId, user.id);
    if (existingPlayer) {
      // Check if player is already on this team
      if (existingPlayer.teamId === teamId) {
        await interaction.editReply({ content: `${user} موجود بالفعل في فريقك.` });
        return;
      }
      
      // Player is on another team
      const existingTeam = await storage.getTeam(existingPlayer.teamId);
      await interaction.editReply({ 
        content: `${user} موجود بالفعل في فريق ${existingTeam?.name || 'آخر'}. استخدم أمر النقل لتوقيعه في فريقك.` 
      });
      return;
    }
    
    // Create the player record
    const player = await storage.createPlayer({
      serverId,
      userId: user.id,
      teamId,
      username: user.username,
      nickname: user.username,
      joinedAt: new Date()
    });
    
    // Update team roster count
    const currentCount = team.rosterCount || 0;
    await storage.updateTeam(team.id, {
      rosterCount: currentCount + 1,
      updatedAt: new Date()
    });
    
    // Add team role to the user if possible
    try {
      const guild = interaction.guild;
      if (guild) {
        const guildMember = await guild.members.fetch(user.id);
        const role = guild.roles.cache.get(team.roleId);
        if (role) {
          await guildMember.roles.add(role);
        }
      }
    } catch (error) {
      console.error('Error adding team role to player:', error);
      // Continue execution even if role assignment fails
    }
    
    // Create transaction record
    const transaction = await storage.createTransaction({
      serverId,
      transactionType: 'sign',
      amount: 0,
      status: 'completed',
      sourceTeamId: team.id,
      targetTeamId: null,
      playerId: player.id,
      reason: `${user.username} signed to ${team.name}`,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Create and send embed
    const embed = createTransactionEmbed(
      'sign',
      0,
      'signed',
      team,
      undefined,
      player
    );
    
    await interaction.editReply({ embeds: [embed] });
    
  } catch (error) {
    console.error('Error handling sign command:', error);
    await interaction.editReply({ content: 'حدث خطأ أثناء معالجة أمر التوقيع.' });
  }
}

// Handle release command
async function handleReleaseCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  
  const serverId = interaction.guildId;
  if (!serverId) {
    await interaction.editReply({ content: 'هذا الأمر يمكن استخدامه فقط في سيرفر!' });
    return;
  }
  
  try {
    // Get the player user
    const user = interaction.options.getUser('player');
    if (!user) {
      await interaction.editReply({ content: 'يجب تحديد لاعب للإطلاق.' });
      return;
    }
    
    // Check if the user is a coach
    const member = interaction.member;
    if (!member || !('roles' in member)) {
      await interaction.editReply({ content: 'فشل في التحقق من صلاحياتك.' });
      return;
    }
    
    // Get coach role IDs for this member
    const memberRoles = Array.isArray(member.roles) 
      ? member.roles 
      : member.roles.cache.map(role => role.id);
    
    // Find all coach assignments for this member
    const coachAssignments = await storage.getCoachAssignmentsByUser(serverId, interaction.user.id);
    if (coachAssignments.length === 0) {
      await interaction.editReply({ content: 'يجب أن تكون مدرباً لفريق لاستخدام هذا الأمر.' });
      return;
    }
    
    // Get the team for the first coach assignment
    const teamId = coachAssignments[0].teamId;
    const team = await storage.getTeam(teamId);
    
    if (!team) {
      await interaction.editReply({ content: 'لم يتم العثور على الفريق المرتبط بك.' });
      return;
    }
    
    // Check if player exists and is on this team
    const player = await storage.getPlayerByUserId(serverId, user.id);
    if (!player) {
      await interaction.editReply({ content: `${user} ليس لاعباً مسجلاً في الدوري.` });
      return;
    }
    
    if (player.teamId !== teamId) {
      await interaction.editReply({ content: `${user} ليس في فريقك. يمكنك فقط إطلاق اللاعبين من فريقك.` });
      return;
    }
    
    // Update player status
    await storage.updatePlayer(player.id, {
      teamId: null // null means free agent
    });
    
    // Update team roster count
    const currentCount = team.rosterCount || 0;
    await storage.updateTeam(team.id, {
      rosterCount: Math.max(0, currentCount - 1),
      updatedAt: new Date()
    });
    
    // Remove team role from the user if possible
    try {
      const guild = interaction.guild;
      if (guild) {
        const guildMember = await guild.members.fetch(user.id);
        const role = guild.roles.cache.get(team.roleId);
        if (role) {
          await guildMember.roles.remove(role);
        }
      }
    } catch (error) {
      console.error('Error removing team role from player:', error);
      // Continue execution even if role removal fails
    }
    
    // Create transaction record
    const transaction = await storage.createTransaction({
      serverId,
      transactionType: 'release',
      amount: 0,
      status: 'completed',
      sourceTeamId: team.id,
      targetTeamId: null,
      playerId: player.id,
      reason: `${user.username} released from ${team.name}`,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Create and send embed
    const embed = createTransactionEmbed(
      'release',
      0,
      'released',
      team,
      undefined,
      player
    );
    
    await interaction.editReply({ embeds: [embed] });
    
  } catch (error) {
    console.error('Error handling release command:', error);
    await interaction.editReply({ content: 'حدث خطأ أثناء معالجة أمر الإطلاق.' });
  }
}

export const playerManagementCommands = [
  signCommand,
  signArabicCommand,
  releaseCommand,
  releaseArabicCommand
];