import { z } from 'zod';
export const schemas = {
  pages: {
    home: z.object({
      "meta": z.object({
        "title": z.string(),
        "description": z.string()
      }),
      "hero": z.object({
        "headline": z.string(),
        "headlineGold": z.string(),
        "subheadline": z.string(),
        "primaryCta": z.string(),
        "secondaryCta": z.string(),
        "badges": z.array(z.object({
          "id": z.string(),
          "label": z.string()
        }))
      }),
      "stories": z.array(z.object({
        "id": z.string(),
        "heading": z.string(),
        "body": z.string(),
        "highlight": z.string()
      })),
      "trustStrip": z.array(z.object({
        "id": z.string(),
        "label": z.string(),
        "body": z.string()
      })),
      "howItWorks": z.object({
        "eyebrow": z.string(),
        "headline": z.string(),
        "headlineGold": z.string(),
        "steps": z.array(z.object({
          "id": z.string(),
          "number": z.string(),
          "title": z.string(),
          "body": z.string()
        }))
      }),
      "whoItsFor": z.object({
        "eyebrow": z.string(),
        "headline": z.string(),
        "headlineGold": z.string(),
        "cards": z.array(z.object({
          "id": z.string(),
          "label": z.string(),
          "title": z.string(),
          "body": z.string()
        }))
      }),
      "athletesBand": z.object({
        "eyebrow": z.string(),
        "headline": z.string(),
        "headlineGold": z.string(),
        "body": z.string(),
        "badges": z.array(z.object({
          "id": z.string(),
          "label": z.string()
        })),
        "cta": z.string()
      }),
      "coachesBand": z.object({
        "eyebrow": z.string(),
        "headline": z.string(),
        "headlineGold": z.string(),
        "body": z.string(),
        "badges": z.array(z.object({
          "id": z.string(),
          "label": z.string()
        })),
        "cta": z.string()
      }),
      "veteransBand": z.object({
        "eyebrow": z.string(),
        "headline": z.string(),
        "headlineGold": z.string(),
        "body": z.string(),
        "cta": z.string()
      }),
      "forCompaniesBand": z.object({
        "eyebrow": z.string(),
        "headline": z.string(),
        "cta": z.string()
      }),
      "faq": z.object({
        "eyebrow": z.string(),
        "headline": z.string(),
        "headlineGold": z.string(),
        "items": z.array(z.object({
          "id": z.string(),
          "question": z.string(),
          "answer": z.string()
        }))
      }),
      "closingBand": z.object({
        "headline": z.string(),
        "headlineGold": z.string(),
        "cta": z.string()
      })
    }),
    pricing: z.object({
      "hero": z.object({
        "heading": z.string(),
        "subheading": z.string()
      }),
      "toggle": z.object({
        "quarterly": z.string(),
        "annual": z.string(),
        "annualSavings": z.string()
      }),
      "plans": z.array(z.object({
        "id": z.string(),
        "name": z.string(),
        "tagline": z.string(),
        "quarterlyPrice": z.string(),
        "quarterlyBilling": z.string(),
        "annualPrice": z.string(),
        "annualBilling": z.string(),
        "features": z.array(z.object({
          "id": z.string(),
          "text": z.string()
        })),
        "cta": z.string()
      })),
      "discounts": z.object({
        "heading": z.string(),
        "body": z.string(),
        "couponLabel": z.string(),
        "couponCode": z.string()
      }),
      "members": z.object({
        "heading": z.string(),
        "body": z.string(),
        "cta": z.string()
      }),
      "verification": z.object({
        "heading": z.string(),
        "body": z.string(),
        "cta": z.string()
      })
    }),
    company_account: z.object({
      "heading": z.string(),
      "noPlan": z.object({
        "title": z.string(),
        "body": z.string(),
        "cta": z.string()
      }),
      "currentPlan": z.object({
        "label": z.string(),
        "renewsOn": z.string(),
        "cancelsOn": z.string(),
        "expired": z.object({
          "message": z.string(),
          "cta": z.string()
        })
      }),
      "switchToYearly": z.object({
        "label": z.string(),
        "heading": z.string(),
        "body": z.string(),
        "cta": z.string(),
        "switching": z.string(),
        "successMessage": z.string()
      })
    }),
    verify_company: z.object({
      "heading": z.string(),
      "body": z.string(),
      "ctaPrimary": z.string(),
      "ctaSecondary": z.string()
    }),
    verify_company_apply: z.object({
      "step1": z.object({
        "heading": z.string(),
        "subheading": z.string(),
        "emailLabel": z.string(),
        "emailPlaceholder": z.string(),
        "sendCodeCta": z.string(),
        "codeLabel": z.string(),
        "codePlaceholder": z.string(),
        "confirmCta": z.string(),
        "resendCta": z.string(),
        "freeEmailError": z.string(),
        "successMessage": z.string()
      }),
      "step2": z.object({
        "heading": z.string(),
        "subheading": z.string(),
        "orgTypes": z.array(z.object({
          "id": z.string(),
          "label": z.string()
        })),
        "authCheckbox": z.string(),
        "submitCta": z.string(),
        "underReviewMessage": z.string()
      })
    }),
    admin_companies: z.object({
      "heading": z.string(),
      "filters": z.array(z.string()),
      "emptyMessage": z.string(),
      "domainMatch": z.string(),
      "domainMismatch": z.string(),
      "approveLabel": z.string(),
      "rejectLabel": z.string(),
      "askInfoLabel": z.string(),
      "missionDiscountLabel": z.string(),
      "skillbridgeLabel": z.string(),
      "rejectReasonPlaceholder": z.string(),
      "askInfoPlaceholder": z.string(),
      "adminNotePlaceholder": z.string()
    }),
    trust: z.object({
      "meta": z.object({
        "title": z.string(),
        "description": z.string()
      }),
      "hero": z.object({
        "label": z.string(),
        "headline": z.string(),
        "subheadline": z.string()
      }),
      "checks": z.array(z.object({
        "id": z.string(),
        "icon": z.string(),
        "title": z.string(),
        "body": z.string()
      })),
      "neverSection": z.object({
        "heading": z.string(),
        "intro": z.string(),
        "items": z.array(z.object({
          "id": z.string(),
          "text": z.string()
        }))
      }),
      "reportSection": z.object({
        "heading": z.string(),
        "body": z.string(),
        "reportCta": z.string(),
        "emailLabel": z.string(),
        "email": z.string()
      }),
      "disclaimer": z.string()
    }),
    jobs: z.object({
      "jobTypeLabels": z.array(z.object({
        "key": z.string(),
        "label": z.string(),
        "id": z.string()
      })),
      "industries": z.array(z.string())
    }),
    for_companies: z.object({
      "hero": z.object({
        "eyebrow": z.string(),
        "headline": z.string(),
        "headlineGold": z.string(),
        "cta": z.string()
      }),
      "howItWorks": z.object({
        "eyebrow": z.string(),
        "headline": z.string(),
        "headlineGold": z.string(),
        "steps": z.array(z.object({
          "id": z.string(),
          "number": z.string(),
          "title": z.string(),
          "body": z.string()
        }))
      }),
      "whoYoullMeet": z.object({
        "eyebrow": z.string(),
        "headline": z.string(),
        "headlineGold": z.string(),
        "body": z.string(),
        "profiles": z.array(z.object({
          "id": z.string(),
          "label": z.string(),
          "body": z.string()
        }))
      }),
      "veteranHiring": z.object({
        "eyebrow": z.string(),
        "headline": z.string(),
        "body": z.string(),
        "points": z.array(z.object({
          "id": z.string(),
          "text": z.string()
        })),
        "cta": z.string()
      }),
      "trustStrip": z.object({
        "items": z.array(z.object({
          "id": z.string(),
          "stat": z.string(),
          "label": z.string()
        }))
      }),
      "faq": z.object({
        "eyebrow": z.string(),
        "headline": z.string(),
        "headlineGold": z.string(),
        "items": z.array(z.object({
          "id": z.string(),
          "question": z.string(),
          "answer": z.string()
        }))
      }),
      "closingBand": z.object({
        "eyebrow": z.string(),
        "headline": z.string(),
        "headlineGold": z.string(),
        "body": z.string(),
        "primaryCta": z.string(),
        "secondaryCta": z.string()
      })
    }),
    veterans: z.object({
      "meta": z.object({
        "title": z.string(),
        "description": z.string()
      }),
      "hero": z.object({
        "eyebrow": z.string(),
        "headline": z.string(),
        "headlineGold": z.string(),
        "subheadline": z.string()
      }),
      "whatWeOffer": z.object({
        "eyebrow": z.string(),
        "headline": z.string(),
        "headlineGold": z.string(),
        "items": z.array(z.object({
          "id": z.string(),
          "title": z.string(),
          "body": z.string()
        }))
      }),
      "verification": z.object({
        "eyebrow": z.string(),
        "headline": z.string(),
        "headlineGold": z.string(),
        "body": z.string(),
        "steps": z.array(z.object({
          "id": z.string(),
          "number": z.string(),
          "title": z.string(),
          "body": z.string()
        })),
        "neverAsk": z.array(z.object({
          "id": z.string(),
          "text": z.string()
        })),
        "neverAskLabel": z.string()
      }),
      "resources": z.object({
        "eyebrow": z.string(),
        "headline": z.string(),
        "headlineGold": z.string(),
        "body": z.string(),
        "items": z.array(z.object({
          "id": z.string(),
          "title": z.string(),
          "body": z.string()
        }))
      }),
      "badges": z.object({
        "eyebrow": z.string(),
        "headline": z.string(),
        "headlineGold": z.string(),
        "veteranReady": z.object({
          "label": z.string(),
          "body": z.string()
        }),
        "skillbridge": z.object({
          "label": z.string(),
          "body": z.string()
        })
      }),
      "cta": z.object({
        "eyebrow": z.string(),
        "headline": z.string(),
        "headlineGold": z.string(),
        "body": z.string(),
        "primaryCta": z.string(),
        "secondaryCta": z.string()
      })
    }),
    terms: z.object({
      "meta": z.object({
        "title": z.string(),
        "description": z.string()
      }),
      "lastUpdated": z.string(),
      "headline": z.string(),
      "headlineGold": z.string(),
      "intro": z.string(),
      "sections": z.array(z.object({
        "id": z.string(),
        "heading": z.string(),
        "body": z.array(z.object({
          "id": z.string(),
          "text": z.string()
        }))
      }))
    }),
    privacy: z.object({
      "meta": z.object({
        "title": z.string(),
        "description": z.string()
      }),
      "lastUpdated": z.string(),
      "headline": z.string(),
      "headlineGold": z.string(),
      "intro": z.string(),
      "sections": z.array(z.object({
        "id": z.string(),
        "heading": z.string(),
        "body": z.array(z.object({
          "id": z.string(),
          "text": z.string()
        }))
      }))
    }),
    community_rules: z.object({
      "meta": z.object({
        "title": z.string(),
        "description": z.string()
      }),
      "lastUpdated": z.string(),
      "headline": z.string(),
      "headlineGold": z.string(),
      "intro": z.string(),
      "sections": z.array(z.object({
        "id": z.string(),
        "heading": z.string(),
        "body": z.array(z.object({
          "id": z.string(),
          "text": z.string()
        }))
      }))
    }),
    athletes: z.object({
      "meta": z.object({
        "title": z.string(),
        "description": z.string()
      }),
      "hero": z.object({
        "eyebrow": z.string(),
        "headline": z.string(),
        "headlineGold": z.string(),
        "subheadline": z.string()
      }),
      "whatWeOffer": z.object({
        "eyebrow": z.string(),
        "headline": z.string(),
        "headlineGold": z.string(),
        "items": z.array(z.object({
          "id": z.string(),
          "number": z.string(),
          "title": z.string(),
          "body": z.string()
        }))
      }),
      "whoCanJoin": z.object({
        "eyebrow": z.string(),
        "headline": z.string(),
        "headlineGold": z.string(),
        "body": z.string(),
        "note": z.string()
      }),
      "industries": z.object({
        "eyebrow": z.string(),
        "headline": z.string(),
        "headlineGold": z.string(),
        "body": z.string(),
        "tags": z.array(z.object({
          "id": z.string(),
          "label": z.string()
        }))
      }),
      "neverPay": z.object({
        "eyebrow": z.string(),
        "headline": z.string(),
        "headlineGold": z.string(),
        "body": z.string(),
        "reportCta": z.string(),
        "reportHref": z.string()
      }),
      "cta": z.object({
        "primaryLabel": z.string(),
        "secondaryLabel": z.string(),
        "secondaryHref": z.string()
      })
    }),
    coaches: z.object({
      "meta": z.object({
        "title": z.string(),
        "description": z.string()
      }),
      "hero": z.object({
        "eyebrow": z.string(),
        "headline": z.string(),
        "headlineGold": z.string(),
        "subheadline": z.string()
      }),
      "whatWeOffer": z.object({
        "eyebrow": z.string(),
        "headline": z.string(),
        "headlineGold": z.string(),
        "items": z.array(z.object({
          "id": z.string(),
          "number": z.string(),
          "title": z.string(),
          "body": z.string()
        }))
      }),
      "whoCanJoin": z.object({
        "eyebrow": z.string(),
        "headline": z.string(),
        "headlineGold": z.string(),
        "body": z.string(),
        "note": z.string()
      }),
      "roles": z.object({
        "eyebrow": z.string(),
        "headline": z.string(),
        "headlineGold": z.string(),
        "body": z.string(),
        "tags": z.array(z.object({
          "id": z.string(),
          "label": z.string()
        }))
      }),
      "neverPay": z.object({
        "eyebrow": z.string(),
        "headline": z.string(),
        "headlineGold": z.string(),
        "body": z.string(),
        "reportCta": z.string(),
        "reportHref": z.string()
      }),
      "cta": z.object({
        "primaryLabel": z.string(),
        "secondaryLabel": z.string(),
        "secondaryHref": z.string()
      })
    }),
    dashboard: z.object({
      "connectionRequests": z.object({
        "sectionLabel": z.string(),
        "emptyHeading": z.string(),
        "emptyBody": z.string(),
        "acceptLabel": z.string(),
        "declineLabel": z.string(),
        "acceptedLabel": z.string(),
        "noteLabel": z.string(),
        "skillbridgeLabel": z.string(),
        "removeLabel": z.string(),
        "removeConfirm": z.string()
      })
    }),
    messages: z.object({
      "safetyNotice": z.string(),
      "emptyHeading": z.string(),
      "emptyBody": z.string(),
      "readOnlyNotice": z.string(),
      "blockedNotice": z.string(),
      "reportLabel": z.string(),
      "blockLabel": z.string(),
      "blockConfirm": z.string(),
      "reportConfirm": z.string(),
      "reportReasonPlaceholder": z.string(),
      "sendPlaceholder": z.string(),
      "sendLabel": z.string(),
      "pageTitle": z.string()
    }),
    admin_messages: z.object({
      "pageTitle": z.string(),
      "pageSubtitle": z.string(),
      "emptyHeading": z.string(),
      "emptyBody": z.string(),
      "dismissLabel": z.string(),
      "dismissedLabel": z.string(),
      "companyLabel": z.string(),
      "memberLabel": z.string()
    }),
    profile_edit: z.object({
      "notificationsSection": z.string(),
      "newMessageEmailLabel": z.string(),
      "newMessageEmailDesc": z.string(),
      "notifSavedMsg": z.string()
    })
  }
};
export type Schemas = typeof schemas;