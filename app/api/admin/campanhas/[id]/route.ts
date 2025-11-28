import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Normaliza uma data string para evitar problemas de timezone
 * Garante que a data seja tratada como DATE local, não como TIMESTAMP
 */
function normalizeDate(dateString: string | null | undefined): string | null {
  if (!dateString || dateString.trim() === '') {
    return null;
  }

  const trimmed = dateString.trim();

  // Se já está no formato YYYY-MM-DD, retornar diretamente
  // O PostgreSQL interpreta strings no formato YYYY-MM-DD como DATE (sem timezone)
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // Se não está no formato esperado, tentar parsear e converter
  try {
    // Criar uma data local a partir da string
    const date = new Date(trimmed);
    if (isNaN(date.getTime())) {
      return null;
    }
    
    // Usar métodos locais (getFullYear, getMonth, getDate) para evitar conversão de timezone
    // Isso garante que a data seja a mesma que o usuário selecionou
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch {
    return null;
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    console.log('📥 [API Campanhas] Atualizando campanha:', id, body);

    const supabase = createAdminClient();

    // Preparar dados para atualização da campanha
    const updateData: any = {};

    if (body.data_fim !== undefined) {
      // Normalizar data para evitar problemas de timezone
      updateData.data_fim = normalizeDate(body.data_fim);
    }

    if (body.valor !== undefined) {
      updateData.valor_mensal = body.valor;
    }

    if (body.ativo !== undefined) {
      updateData.ativo = body.ativo;
    }

    if (body.participa_cotacao !== undefined) {
      updateData.participa_cotacao = body.participa_cotacao;
    }

    if (body.limite_orcamentos_mes !== undefined) {
      updateData.limite_orcamentos_mes = body.limite_orcamentos_mes || null;
    }

    if (body.plano_id !== undefined) {
      updateData.plano_id = body.plano_id || null;
    }

    if (body.envia_email_ativacao !== undefined) {
      updateData.envia_email_ativacao = body.envia_email_ativacao;
    }

    // Buscar campanha atual para verificar mudança de status
    const { data: campanhaAtual, error: errorCampanhaAtual } = await supabase
      .from('campanhas')
      .select(`
        *,
        hotsites (
          id,
          nome_exibicao,
          email
        ),
        planos (
          nome
        )
      `)
      .eq('id', id)
      .single();

    if (errorCampanhaAtual) {
      console.error('❌ [API Campanhas] Erro ao buscar campanha atual:', errorCampanhaAtual);
    }

    const statusAnterior = campanhaAtual?.ativo;
    const novoStatus = body.ativo !== undefined ? body.ativo : statusAnterior;
    // Usar o valor atualizado do banco se foi atualizado, senão usar o anterior
    const enviaEmail = updateData.envia_email_ativacao !== undefined 
      ? updateData.envia_email_ativacao 
      : (campanhaAtual?.envia_email_ativacao || false);

    console.log('🔍 [API Campanhas] Dados da campanha atual:', {
      id,
      statusAnterior,
      novoStatus,
      mudouStatus: statusAnterior !== undefined && statusAnterior !== novoStatus,
      enviaEmail,
      enviaEmailAtual: campanhaAtual?.envia_email_ativacao,
      enviaEmailUpdate: updateData.envia_email_ativacao,
      hotsiteEmail: campanhaAtual?.hotsites?.email,
      hotsiteNome: campanhaAtual?.hotsites?.nome_exibicao
    });

    // Atualizar campanha no banco
    const { data, error } = await supabase
      .from('campanhas')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        hotsites (
          id,
          nome_exibicao,
          email
        ),
        planos (
          nome
        )
      `)
      .single();

    if (error) {
      console.error('❌ [API Campanhas] Erro ao atualizar campanha:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Se tipoempresa, email ou telefone1 foi enviado, atualizar o hotsite
    if (body.hotsite_id) {
      const hotsiteUpdateData: any = {};
      
      if (body.tipoempresa !== undefined) {
        hotsiteUpdateData.tipoempresa = body.tipoempresa;
      }
      
      if (body.email !== undefined) {
        hotsiteUpdateData.email = body.email;
      }
      
      if (body.telefone1 !== undefined) {
        hotsiteUpdateData.telefone1 = body.telefone1 || null;
      }
      
      if (Object.keys(hotsiteUpdateData).length > 0) {
        console.log('📝 [API Campanhas] Atualizando hotsite:', body.hotsite_id, hotsiteUpdateData);
        
        const { error: hotsiteError } = await supabase
          .from('hotsites')
          .update(hotsiteUpdateData)
          .eq('id', body.hotsite_id);

        if (hotsiteError) {
          console.error('❌ [API Campanhas] Erro ao atualizar hotsite:', hotsiteError);
          // Não retorna erro fatal, apenas loga
        } else {
          console.log('✅ [API Campanhas] Hotsite atualizado!', hotsiteUpdateData);
        }
      }
    }

    console.log('✅ [API Campanhas] Campanha atualizada com sucesso!');

    // Log detalhado para debug
    console.log('🔍 [API Campanhas] Verificando condições para envio de email:', {
      statusAnterior,
      novoStatus,
      statusAnteriorType: typeof statusAnterior,
      novoStatusType: typeof novoStatus,
      mudouStatus: statusAnterior !== undefined && statusAnterior !== novoStatus,
      enviaEmail,
      enviaEmailType: typeof enviaEmail,
      temData: !!data,
      hotsiteEmail: (data as any)?.hotsites?.email,
      campanhaId: id,
      bodyAtivo: body.ativo,
      bodyAtivoType: typeof body.ativo
    });

    // Se houve mudança de status e envia_email_ativacao está ativo, enviar email
    // Verificar explicitamente se body.ativo foi enviado (mudança de status)
    const houveMudancaStatus = body.ativo !== undefined && statusAnterior !== undefined && statusAnterior !== body.ativo;
    
    console.log('🔍 [API Campanhas] Verificação de mudança de status:', {
      bodyAtivoDefinido: body.ativo !== undefined,
      statusAnteriorDefinido: statusAnterior !== undefined,
      statusAnterior,
      bodyAtivo: body.ativo,
      saoDiferentes: statusAnterior !== body.ativo,
      houveMudancaStatus,
      enviaEmail,
      temData: !!data
    });

    if (houveMudancaStatus && enviaEmail && data) {
      const hotsite = (data as any).hotsites;
      const plano = (data as any).planos;
      
      console.log('📧 [API Campanhas] Condições atendidas! Preparando envio de email...', {
        hotsiteEmail: hotsite?.email,
        hotsiteNome: hotsite?.nome_exibicao,
        novoStatus,
        tipoEmail: novoStatus ? 'campanha_ativada' : 'campanha_desativada'
      });
      
      if (hotsite?.email) {
        try {
          // Importar dependências de email
          const { importEmailService } = await import('@/lib/email/dynamic-import');
          const { processEmailTemplate } = await import('@/lib/email/template-service');
          const { getEmailConfig } = await import('@/lib/email/config');
          const { formatDateOnlyBR } = await import('@/lib/utils/date');
          
          const emailConfig = await getEmailConfig();
          
          console.log('📧 [API Campanhas] Configuração de email:', {
            existe: !!emailConfig,
            from_email: emailConfig?.from_email,
            provider: emailConfig?.provider
          });
          
          if (emailConfig && emailConfig.from_email) {
            const tipoEmail = novoStatus ? 'campanha_ativada' : 'campanha_desativada';
            
            console.log('📧 [API Campanhas] Processando template:', tipoEmail);
            
            // Processar template
            const templateResult = await processEmailTemplate(
              tipoEmail,
              {
                nome_empresa: hotsite.nome_exibicao || 'Empresa',
                nome_campanha: hotsite.nome_exibicao || 'Campanha',
                nome_plano: plano?.nome || 'Sem plano',
                data_inicio: formatDateOnlyBR(data.data_inicio),
                data_vencimento: data.data_fim ? formatDateOnlyBR(data.data_fim) : 'Sem vencimento',
                data_fim: data.data_fim ? formatDateOnlyBR(data.data_fim) : null,
                valor_mensal: data.valor_mensal ? `R$ ${data.valor_mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null,
                plano: plano?.nome || 'Sem plano'
              },
              {
                campanha_id: id,
                hotsite_id: hotsite.id,
                tipo_email: tipoEmail
              }
            );

            if (templateResult && templateResult.assunto && templateResult.html) {
              console.log('✅ [API Campanhas] Template processado com sucesso:', {
                assunto: templateResult.assunto,
                htmlLength: templateResult.html.length
              });
              
              const emailService = await importEmailService(emailConfig.provider || 'socketlabs');
              
              const serviceConfig = emailConfig.provider === 'socketlabs' 
                ? { apiKey: emailConfig.api_key, serverId: emailConfig.server_id }
                : { apiKey: emailConfig.api_key };

              console.log('📧 [API Campanhas] Enviando email...', {
                to: hotsite.email,
                subject: templateResult.assunto,
                provider: emailConfig.provider
              });

              // Enviar email diretamente (sem fila)
              const sendResult = await emailService.sendEmail(
                {
                  to: hotsite.email,
                  subject: templateResult.assunto,
                  html: templateResult.html,
                  from: emailConfig.from_email,
                  fromName: emailConfig.from_name || 'MudaTech',
                  replyTo: emailConfig.reply_to || emailConfig.from_email
                },
                serviceConfig,
                {
                  campanha_id: id,
                  hotsite_id: hotsite.id,
                  tipo_email: tipoEmail
                }
              );

              console.log('📧 [API Campanhas] Resultado do envio:', sendResult);
              
              if (sendResult.success) {
                console.log(`✅ [API Campanhas] Email de ${novoStatus ? 'ativação' : 'desativação'} enviado com sucesso para ${hotsite.email}`);
                
                // Salvar log adicional com o tipo_email correto (campanha_ativada/campanha_desativada)
                try {
                  const { saveEmailTracking } = await import('@/lib/email/template-service');
                  await saveEmailTracking({
                    codigo_rastreamento: templateResult.codigoRastreamento,
                    campanha_id: id,
                    hotsite_id: hotsite.id,
                    tipo_email: tipoEmail,
                    email_destinatario: hotsite.email,
                    assunto: templateResult.assunto,
                    metadata: {
                      status_envio: 'enviado',
                      provider: emailConfig.provider,
                      messageId: sendResult.messageId
                    }
                  });
                  console.log(`✅ [API Campanhas] Log de tracking salvo com tipo_email: ${tipoEmail}`);
                } catch (logError: any) {
                  console.error('❌ [API Campanhas] Erro ao salvar log de tracking:', logError);
                }
              } else {
                console.error(`❌ [API Campanhas] Erro ao enviar email:`, sendResult.error);
                
                // Salvar log de erro também
                try {
                  const { saveEmailTracking } = await import('@/lib/email/template-service');
                  await saveEmailTracking({
                    codigo_rastreamento: templateResult.codigoRastreamento,
                    campanha_id: id,
                    hotsite_id: hotsite.id,
                    tipo_email: tipoEmail,
                    email_destinatario: hotsite.email,
                    assunto: templateResult.assunto,
                    metadata: {
                      status_envio: 'erro',
                      provider: emailConfig.provider,
                      erro: sendResult.error
                    }
                  });
                } catch (logError: any) {
                  console.error('❌ [API Campanhas] Erro ao salvar log de erro:', logError);
                }
              }
            } else {
              console.error('❌ [API Campanhas] Template não processado corretamente:', {
                temTemplate: !!templateResult,
                temAssunto: !!templateResult?.assunto,
                temHtml: !!templateResult?.html
              });
            }
          } else {
            console.warn('⚠️ [API Campanhas] Configuração de email não encontrada ou incompleta:', {
              temEmailConfig: !!emailConfig,
              temFromEmail: !!emailConfig?.from_email
            });
          }
        } catch (emailError: any) {
          console.error('❌ [API Campanhas] Erro ao enviar email de ativação/desativação:', emailError);
          console.error('❌ [API Campanhas] Stack trace:', emailError.stack);
          // Não falhar a atualização da campanha se o email falhar
        }
      } else {
        console.warn('⚠️ [API Campanhas] Hotsite sem email:', {
          hotsiteId: hotsite?.id,
          hotsiteNome: hotsite?.nome_exibicao,
          temEmail: !!hotsite?.email
        });
      }
    } else {
      console.log('ℹ️ [API Campanhas] Email não será enviado:', {
        statusAnterior,
        novoStatus,
        mudouStatus: statusAnterior !== undefined && statusAnterior !== novoStatus,
        enviaEmail,
        temData: !!data
      });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('❌ [API Campanhas] Erro inesperado:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log('📥 [API Campanhas] Deletando campanha:', id);

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('campanhas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ [API Campanhas] Erro ao deletar:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log('✅ [API Campanhas] Campanha deletada com sucesso!');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ [API Campanhas] Erro inesperado:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

