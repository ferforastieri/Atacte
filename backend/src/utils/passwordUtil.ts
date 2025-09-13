import zxcvbn from 'zxcvbn';

export interface PasswordGeneratorOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
}

export interface PasswordStrength {
  score: number; // 0-4
  feedback: {
    warning: string;
    suggestions: string[];
  };
  crackTime: string;
}

export class PasswordUtil {
  // Gerar senha segura
  static generateSecurePassword(options: PasswordGeneratorOptions): {
    password: string;
    strength: PasswordStrength;
  } {
    const {
      length,
      includeUppercase,
      includeLowercase,
      includeNumbers,
      includeSymbols
    } = options;

    // Construir charset baseado nas opções
    let charset = '';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!charset) {
      throw new Error('Pelo menos um tipo de caractere deve ser selecionado');
    }

    // Gerar senha usando charset customizado
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    // Avaliar força da senha
    const strength = this.evaluatePasswordStrength(password);

    return { password, strength };
  }

  // Avaliar força da senha
  static evaluatePasswordStrength(password: string): PasswordStrength {
    const result = zxcvbn(password);
    
    return {
      score: result.score,
      feedback: {
        warning: result.feedback.warning || '',
        suggestions: result.feedback.suggestions || []
      },
      crackTime: this.formatCrackTime(result.crack_times_display.offline_slow_hashing_1e4_per_second)
    };
  }

  // Formatar tempo de quebra
  private static formatCrackTime(crackTime: string): string {
    const timeMap: { [key: string]: string } = {
      'instant': 'instantâneo',
      'less than a second': 'menos de um segundo',
      'seconds': 'segundos',
      'minutes': 'minutos',
      'hours': 'horas',
      'days': 'dias',
      'months': 'meses',
      'years': 'anos',
      'centuries': 'séculos'
    };

    let formatted = crackTime;
    Object.entries(timeMap).forEach(([en, pt]) => {
      formatted = formatted.replace(new RegExp(en, 'gi'), pt);
    });

    return formatted;
  }

  // Verificar se a senha atende aos critérios mínimos
  static validatePasswordStrength(password: string, minScore: number = 3): {
    isValid: boolean;
    strength: PasswordStrength;
  } {
    const strength = this.evaluatePasswordStrength(password);
    return {
      isValid: strength.score >= minScore,
      strength
    };
  }

  // Detectar senhas duplicadas
  static findDuplicatePasswords(passwords: string[]): string[] {
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    passwords.forEach(password => {
      if (seen.has(password)) {
        duplicates.add(password);
      } else {
        seen.add(password);
      }
    });

    return Array.from(duplicates);
  }

  // Verificar se senha contém informações pessoais
  static containsPersonalInfo(password: string, personalInfo: string[]): boolean {
    const lowerPassword = password.toLowerCase();
    return personalInfo.some(info => 
      info.length > 2 && lowerPassword.includes(info.toLowerCase())
    );
  }
}
