import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { __ } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useProviders, useMailboxes, useEntryLabels } from "@/hooks";
import { CheckCircle2, Circle, Mail, Server, Tag, FileText, ArrowRight } from "lucide-react";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  completed: boolean;
  external?: boolean;
}

export default function WelcomePage() {
  const navigate = useNavigate();
  const { providers, loading: providersLoading } = useProviders();
  const { mailboxes, loading: mailboxesLoading } = useMailboxes();
  const { labels, loading: labelsLoading } = useEntryLabels();
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

  // Check completion status
  useEffect(() => {
    if (providersLoading || mailboxesLoading || labelsLoading) return;

    // Check if providers are different from seed (more than just database provider)
    const hasCustomProviders = providers.some(
      (p) => p.provider_type !== 'database' || p.form_identifier !== null
    );
    const hasEmailProvider = providers.some((p) => p.provider_type === 'email');

    // Check if mailboxes are different from seed (more than just default)
    const hasCustomMailboxes = mailboxes.length > 1 || 
      (mailboxes.length === 1 && mailboxes[0].title !== __('defaultMailbox'));

    // Check if labels are different from seed (more than just default labels)
    const defaultLabelNames = [__('important'), __('followUp')];
    const hasCustomLabels = labels.some(
      (label) => !defaultLabelNames.includes(label.name)
    ) || labels.length !== defaultLabelNames.length;

    setChecklist([
      {
        id: 'provider',
        title: __('addFirstMailProvider'),
        description: __('configureEmailProvider'),
        icon: <Server className="h-5 w-5" />,
        link: '#/settings/providers',
        completed: hasEmailProvider,
      },
      {
        id: 'mailbox',
        title: __('setupYourFirstMailbox'),
        description: __('createCustomMailbox'),
        icon: <Mail className="h-5 w-5" />,
        link: '#/settings/mailboxes',
        completed: hasCustomMailboxes,
      },
      {
        id: 'labels',
        title: __('areTheLabelsDefaultOk'),
        description: __('reviewAndCustomizeLabels'),
        icon: <Tag className="h-5 w-5" />,
        link: '#/settings/labels',
        completed: hasCustomLabels,
      },
      {
        id: 'form',
        title: __('buildYourFirstForm'),
        description: __('createFirstFormDescription'),
        icon: <FileText className="h-5 w-5" />,
        link: '/wp-admin/post-new.php?post_type=page', // Will be updated to link to block pattern or new page
        external: true,
        completed: false, // This will be checked separately
      },
    ]);
  }, [providers, mailboxes, labels, providersLoading, mailboxesLoading, labelsLoading]);

  // Check if first steps were skipped
  useEffect(() => {
    const checkSkipped = async () => {
      try {
        const response = await fetch(`${window.streameryForms?.apiUrl || ''}streamery-forms/v1/settings/skip-first-steps`, {
          method: 'GET',
          headers: {
            'X-WP-Nonce': window.streameryForms?.nonce || '',
          },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.skipped) {
            navigate('/inbox');
          }
        }
      } catch (err) {
        console.error('Failed to check skip status:', err);
      }
    };
    checkSkipped();
  }, [navigate]);

  // Redirect to inbox if setup is complete
  useEffect(() => {
    const allCompleted = checklist.length > 0 && checklist.every((item) => item.completed);
    if (allCompleted && checklist.length > 0) {
      // Small delay to show completion state
      const timer = setTimeout(() => {
        navigate('/inbox');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [checklist, navigate]);

  const handleSkipSetup = async () => {
    try {
      const response = await fetch(`${window.streameryForms?.apiUrl || ''}streamery-forms/v1/settings/skip-first-steps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': window.streameryForms?.nonce || '',
        },
        body: JSON.stringify({ skipped: true }),
      });
      if (response.ok) {
        navigate('/inbox');
      }
    } catch (err) {
      console.error('Failed to skip setup:', err);
    }
  };

  const handleItemClick = (item: ChecklistItem) => {
    if (item.link) {
      // Use navigate for internal routes, window.location for hash routes
      if (item.link.startsWith('#')) {
        window.location.href = item.link;
      } else {
        navigate(item.link);
      }
    }
  };

  const allCompleted = checklist.length > 0 && checklist.every((item) => item.completed);

  return (
    <div className="flex items-center justify-center min-h-screen p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">{__('welcomeToStreameryForms')}</CardTitle>
          <CardDescription className="text-lg mt-2">
            {__("letsGetYouStarted")}
          </CardDescription>
          <div className="mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkipSetup}
              className="text-muted-foreground"
            >
              {__('skipSetup')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {checklist.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
              <p className="mt-4 text-muted-foreground">{__('loadingChecklist')}</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all cursor-pointer hover:bg-accent ${
                      item.completed
                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="mt-1">
                      {item.completed ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                      ) : (
                        <Circle className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-gray-600 dark:text-gray-400">
                          {item.icon}
                        </div>
                        <h3 className={`font-semibold ${item.completed ? 'text-green-700 dark:text-green-300' : ''}`}>
                          {item.title}
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    {item.external ? (
                      <a href={item.link} target="_blank" rel="noopener noreferrer">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0"
                        >
                          {item.completed ? __('view') : __('setup')} <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </a>
                      ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemClick(item);
                      }}
                    >
                      {item.completed ? __('view') : __('setup')} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                      )}
                  </div>
                ))}
              </div>

              {allCompleted && (
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg text-center">
                  <p className="text-green-700 dark:text-green-300 font-semibold">
                    {__('allSetRedirecting')}
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

